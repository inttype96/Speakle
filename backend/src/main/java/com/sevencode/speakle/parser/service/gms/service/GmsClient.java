package com.sevencode.speakle.parser.service.gms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sevencode.speakle.parser.service.gms.config.GmsProperties;
import com.sevencode.speakle.parser.service.gms.dto.request.GmsChatRequest;
import com.sevencode.speakle.parser.service.gms.dto.request.Message;
import com.sevencode.speakle.parser.service.gms.dto.response.ResponseFormat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;

import java.util.List;

/**
 * GmsClient
 * - 역할: LLM 게이트웨이(WebClient) 호출 래퍼. 요청 생성, 전송, 응답 텍스트 추출.
 * - 포인트: 기본 파라미터(props.defaults) 적용, JSON 스키마 강제 옵션 지원, 표준 로그/에러 처리.
 * - 응답 파싱: output_text → choices[].message.content(문자열/배열) → output[].content[].text → 실패 시 raw 반환.
 */
@Service
public class GmsClient {

	private static final Logger log = LoggerFactory.getLogger(GmsClient.class);

	private final WebClient gmsWebClient;     // WebClientConfig에서 타임아웃/버퍼 설정
	private final ObjectMapper objectMapper;  // 응답 JSON 파싱
	private final GmsProperties props;        // 엔드포인트/키/기본 파라미터

	// === DEBUG 로그 헬퍼 ===
	private static final int TRACE_MAX = 2000; // 프리뷰 로그 길이 제한

	public GmsClient(WebClient gmsWebClient,
		ObjectMapper objectMapper,
		GmsProperties props) {
		this.gmsWebClient = gmsWebClient;
		this.objectMapper = objectMapper;
		this.props = props;
		// 기본값 바인딩 확인(운영에선 INFO 유지)
		log.info("GMS defaults => model={}, maxTokens={}, temp={}, user={}",
			props.defaults().model(), props.defaults().maxTokens(),
			props.defaults().temperature(), props.defaults().user());
	}

	/**
	 * 단순 채팅 호출(스키마 미적용).
	 */
	public Mono<String> chatSimple(String developerPrompt, String userContent) {
		GmsChatRequest req = buildBaseRequest(developerPrompt, userContent);
		return postAndExtractText(req);
	}

	/**
	 * JSON 스키마 강제 채팅 호출.
	 * @param schemaName 스키마 이름(게이트웨이 포맷)
	 * @param schemaJson JSON 스키마 본문
	 */
	public Mono<String> chatWithSchema(String developerPrompt, String userContent, String schemaName,
		JsonNode schemaJson) {
		GmsChatRequest req = buildBaseRequest(developerPrompt, userContent);
		ResponseFormat.JsonSchema js = new ResponseFormat.JsonSchema(schemaName, schemaJson);
		ResponseFormat rf = new ResponseFormat("json_schema", js);
		req.setResponse_format(rf);
		return postAndExtractText(req);
	}

	/**
	 * 기본 요청 생성: 모델/토큰/온도/유저 태그 + 메시지(developer, user).
	 * - developer 프롬프트 null 시 기본 문구로 대체.
	 */
	private GmsChatRequest buildBaseRequest(String developerPrompt, String userContent) {
		var d = props.defaults();

		GmsChatRequest req = new GmsChatRequest();
		req.setModel(d.model());
		req.setMax_tokens(d.maxTokens());
		req.setTemperature(d.temperature());
		req.setUser(d.user());

		Message dev = new Message("developer",
			developerPrompt != null ? developerPrompt : "You are a helpful assistant.");
		Message usr = new Message("user", userContent);

		req.setMessages(List.of(dev, usr));
		return req;
	}

	/**
	 * 요청 전송 → HTTP 에러 매핑 → 응답 원문 로깅(프리뷰) → assistant 텍스트 추출 → 지연시간 로깅.
	 * - 운영 팁: TRACE로 dev/user preview 로그를 켜면 민감정보 노출 주의.
	 */
	private Mono<String> postAndExtractText(GmsChatRequest req) {
		// 요청 요약 로그(민감 본문 미노출)
		if (log.isDebugEnabled()) {
			String schemaName = null;
			if (req.getResponse_format() != null
				&& req.getResponse_format().getJson_schema() != null) {
				schemaName = req.getResponse_format().getJson_schema().getName();
			}
			String dev =
				req.getMessages() != null && req.getMessages().size() > 0 ? req.getMessages().get(0).getContent() :
					null;
			String usr =
				req.getMessages() != null && req.getMessages().size() > 1 ? req.getMessages().get(1).getContent() :
					null;

			log.debug("GMS req => model={}, max_tokens={}, temp={}, user={}, schema={}, dev_len={}, user_len={}",
				req.getModel(), req.getMax_tokens(), req.getTemperature(), req.getUser(),
				schemaName, safeLenOf(dev), safeLenOf(usr));

			// log.trace("GMS dev.preview: {}", clip(dev));
			// log.trace("GMS usr.preview: {}", clip(usr));
		}

		final long startedAt = System.nanoTime();

		return gmsWebClient.post()
			.bodyValue(req)
			.retrieve()
			// 4xx/5xx 바디 로깅 후 예외 변환
			.onStatus(HttpStatusCode::is4xxClientError, resp ->
				resp.bodyToMono(String.class).defaultIfEmpty("")
					.flatMap(body -> {
						log.warn("GMS 4xx: {}", clip(body));
						return Mono.error(new RuntimeException("GMS client error: " + body));
					}))
			.onStatus(HttpStatusCode::is5xxServerError, resp ->
				resp.bodyToMono(String.class).defaultIfEmpty("")
					.flatMap(body -> {
						log.error("GMS 5xx: {}", clip(body));
						return Mono.error(new RuntimeException("GMS server error: " + body));
					}))
			.bodyToMono(String.class)
			// 원문 응답 프리뷰(길이 + 앞부분)
			.doOnNext(
				raw -> log.debug("GMS resp.raw ({} chars) preview:\n{}", raw != null ? raw.length() : 0, clip(raw)))
			// 모델별 포맷 차이를 흡수하여 텍스트 추출
			.map(this::tryExtractAssistantText)
			.doOnNext(txt -> log.debug("GMS resp.extracted ({} chars) preview:\n{}", txt != null ? txt.length() : 0,
				clip(txt)))
			// 지연시간 측정
			.doFinally(sig -> {
				long ms = (System.nanoTime() - startedAt) / 1_000_000;
				log.debug("GMS latency={} ms (signal={})", ms, sig);
			})
			.onErrorResume(ex -> {
				log.error("GMS call failed", ex);
				return Mono.error(ex);
			});
	}

	/**
	 * 응답 JSON에서 assistant 텍스트를 최대한 호환성 있게 추출.
	 * 우선순위: output_text → choices[0].message.content(문자열/배열:text) → output[0].content[].text → 실패 시 raw.
	 */
	private String tryExtractAssistantText(String rawJson) {
		try {
			JsonNode root = objectMapper.readTree(rawJson);

			if (root.hasNonNull("output_text")) {
				String text = root.get("output_text").asText();
				if (!text.isBlank())
					return text;
			}

			if (root.has("choices") && root.get("choices").isArray() && root.get("choices").size() > 0) {
				JsonNode first = root.get("choices").get(0);
				JsonNode msg = first.get("message");
				if (msg != null) {
					JsonNode content = msg.get("content");
					// (a) 단일 문자열
					if (content != null && content.isTextual() && !content.asText().isBlank()) {
						return content.asText();
					}
					// (b) 배열 형태 (e.g. [{type:"text", text:"..."}])
					if (content != null && content.isArray() && content.size() > 0) {
						for (JsonNode c : content) {
							if (c.has("text") && c.get("text").isTextual()) {
								String t = c.get("text").asText();
								if (!t.isBlank())
									return t;
							}
						}
					}
				}
			}

			if (root.has("output") && root.get("output").isArray() && root.get("output").size() > 0) {
				JsonNode out0 = root.get("output").get(0);
				JsonNode content = out0.get("content");
				if (content != null && content.isArray() && content.size() > 0) {
					for (JsonNode c : content) {
						if (c.has("text") && c.get("text").isTextual()) {
							String t = c.get("text").asText();
							if (!t.isBlank())
								return t;
						}
					}
				}
			}

			return rawJson; // 최후 수단: 원문 반환
		} catch (Exception e) {
			log.warn("Failed to parse GMS response JSON, returning raw", e);
			return rawJson;
		}
	}

	// === 소형 헬퍼 ===

	private String clip(String s) {
		if (s == null)
			return "null";
		return s.length() <= TRACE_MAX ? s : s.substring(0, TRACE_MAX) + " …(truncated)";
	}

	private int safeLenOf(String s) {
		return s == null ? 0 : s.length();
	}

}
