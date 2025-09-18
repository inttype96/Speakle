package com.sevencode.speakle.parser.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sevencode.speakle.parser.repository.ExpressionRepository;
import com.sevencode.speakle.parser.repository.IdiomRepository;
import com.sevencode.speakle.parser.repository.SentenceRepository;
import com.sevencode.speakle.parser.repository.SongParsingRepository;
import com.sevencode.speakle.parser.repository.WordRepository;
import com.sevencode.speakle.parser.service.gms.config.GmsProperties;
import com.sevencode.speakle.parser.service.gms.config.PromptManager;
import com.sevencode.speakle.parser.service.gms.service.GmsClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 *LyricsController.parse(HTTP POST /api/lyrics/parse)
 *   └─▶ LyricsParsingService.parse(rawLyrics)  // ★ 서비스 엔트리 포인트
 *           ├─▶ LyricsPreprocessor.preprocess(...)          // 가사 전처리·청크 분할
 *           ├─▶ buildSchema(), promptManager.lyricsPrompt() // LLM 스키마/프롬프트 준비
 *           ├─▶ (청크 반복) gmsClient.chatWithSchema(...)
 *           │        └─▶ LLM JSON 응답 수신(청크 단위)
 *           ├─▶ Accumulator.accumulate(청크 JSON)           // 키 기반 병합/중복 제거
 *           └─▶ Accumulator.toJson()                        // 최종 JSON 반환
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LyricsParsingService {

	private final LyricsPreprocessor preprocessor;      // 가사 정규화/분할
	private final GmsClient gmsClient;                  // LLM 게이트웨이 클라이언트
	private final ObjectMapper objectMapper;            // JSON 직렬화/역직렬화
	private final GmsProperties props;                  // 모델/토큰/스키마 설정
	private final PromptManager promptManager;          // 프롬프트 버전 로더
	private final LyricsPersistService lyricsPersistService; // DB 존재/저장
	// JPA Repositories (정렬 메서드는 예시 - 프로젝트 네이밍에 맞춰 수정)
	private final WordRepository wordRepository;
	private final ExpressionRepository expressionRepository;
	private final IdiomRepository idiomRepository;
	private final SentenceRepository sentenceRepository;
	private final SongParsingRepository songParsingRepository;

	private static final int TRACE_MAX = 4000;          // 로그 프리뷰 최대 길이(성능/보안 절충)

	private String clip(String s) {                     // 장문 로그 안전 절단
		if (s == null)
			return "";
		return s.length() <= TRACE_MAX ? s : s.substring(0, TRACE_MAX) + " …(truncated)";
	}

	private String pretty(JsonNode n) {                 // 최종 병합 JSON 가독 로그용
		try {
			return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(n);
		} catch (Exception e) {
			return String.valueOf(n);
		}
	}

	// ===== 공개 엔트리 =====

	/** 가사 → 전처리/청크 → LLM(JSON) → 병합/레벨정규화 → 최종 JSON 반환 */
	public Mono<ObjectNode> parse(String rawLyrics) {

		log.debug("[TRACE] lyrics.raw (chars={}, lines≈={}):\n{}",
			rawLyrics != null ? rawLyrics.length() : 0,
			rawLyrics != null ? rawLyrics.lines().count() : 0,
			clip(rawLyrics));

		// 1) 전처리·청크 분할(작으면 1청크)
		List<String> chunks = preprocessor.preprocess(rawLyrics);
		if (chunks == null || chunks.isEmpty())
			return Mono.just(emptyResult());

		// 2) 스키마/프롬프트 준비(스키마 고정, 프롬프트 외부 관리)
		ObjectNode schema = buildSchema();
		String schemaName = props.defaults().schemaName();
		String developerPrompt = promptManager.lyricsPrompt();

		// 3) 청크 순차 호출(concatMap) → JSON 파싱 → 누산
		return Flux.fromIterable(chunks)
			.index()
			.concatMap(t -> { // 순차 처리(레이트/타임아웃 안정성 우선)
				long idx = t.getT1() + 1;
				String chunk = t.getT2();
				log.info("LLM call for chunk #{} (chars={}, lines≈{})", idx, chunk.length(), chunk.lines().count());
				log.debug("[TRACE] chunk #{} input:\n{}", idx, clip(chunk));

				return gmsClient.chatWithSchema(developerPrompt, chunk, schemaName, schema)
					.map(jsonText -> {
						log.debug("[TRACE] chunk #{} response.raw:\n{}", idx, clip(jsonText));
						try {
							return objectMapper.readTree(jsonText);
						} catch (Exception e) {
							log.warn("Chunk #{} returned non-JSON. Using empty slice.", idx);
							return emptyResult(); // 비JSON 방어
						}
					});
			})
			// 4) 병합(자연키 기반 dedupe + 정보 보강)
			.reduce(new Accumulator(objectMapper), Accumulator::accumulate)
			// 5) 최종 JSON + CEFR 레벨 정규화(DB 제약 준수)
			.map(acc -> {
				ObjectNode merged = acc.toJson();
				int fixed = normalizeLevels(merged);   // CEFR 이외 표기 보정/제거
				if (fixed > 0) {
					log.debug("Level normalized (fixed/removals) count={}", fixed);
				}
				log.debug("[TRACE] merged.json:\n{}", pretty(merged));
				return merged;
			});
	}

	/** parse() + 저장. 기존 데이터 있으면 LLM 스킵 후 DB→JSON 반환. */
	public Mono<ObjectNode> parseAndSave(String learnedSongId, String rawLyrics) {
		// JPA I/O는 boundedElastic로 작업분리
		return Mono.fromCallable(() -> lyricsPersistService.existsAny(learnedSongId))
			.subscribeOn(Schedulers.boundedElastic())
			.flatMap(exists -> {
				if (exists) {
					log.info("learnedSongId={} already has parsed rows. Skip LLM.", learnedSongId);
					return Mono.fromCallable(() -> lyricsPersistService.loadAsJson(learnedSongId))
						.subscribeOn(Schedulers.boundedElastic());
				}
				// 신규: 파싱 → 저장 → 결과 반환
				return this.parse(rawLyrics)
					.flatMap(parsed ->
						Mono.fromRunnable(() -> lyricsPersistService.saveAll(learnedSongId, parsed))
							.subscribeOn(Schedulers.boundedElastic())
							.thenReturn(parsed)
					);
			});
	}

	public Mono<ObjectNode> parseAndSaveBySongId(String learnedSongId) {
		if (learnedSongId == null || learnedSongId.isBlank()) {
			return Mono.error(new IllegalArgumentException("songId 값이 비어 있습니다."));
		}

		// 0) 가사 로딩 (없으면 404)
		Mono<String> lyricsMono = Mono.fromCallable(() ->
				songParsingRepository.findLyricsBySongId(learnedSongId))
			.subscribeOn(Schedulers.boundedElastic())
			.flatMap(opt -> opt.map(Mono::just)
				.orElseGet(() -> Mono.error(
					new ResponseStatusException(HttpStatus.NOT_FOUND,
						"해당 songId에 대한 가사가 존재하지 않습니다."))));
		// 1) 이미 파싱/저장 데이터가 있는지 체크
		Mono<Boolean> existsMono = Mono.fromCallable(() ->
				lyricsPersistService.existsAny(learnedSongId))
			.subscribeOn(Schedulers.boundedElastic());

		return existsMono.flatMap(exists -> {
			if (exists) {
				log.info("songId={} 이미 파싱 데이터 존재 → LLM 스킵, JPA 재조회 후 조립", learnedSongId);
				return assembleFromJpa(learnedSongId); // ← JPA에서 재조회해 조립
			}

			// 신규: 가사 로딩 → 파싱 → 저장 → JPA 재조회/조립
			return lyricsMono
				.flatMap(rawLyrics -> {
					if (rawLyrics.isBlank()) {
						return Mono.error(new ResponseStatusException(
							HttpStatus.BAD_REQUEST, "해당 songId의 가사가 비어 있습니다."));
					}
					return parse(rawLyrics); // Mono<ObjectNode> (LLM 파싱 결과)
				})
				.flatMap(parsed ->
					Mono.fromRunnable(() -> lyricsPersistService.saveAll(learnedSongId, parsed))
						.subscribeOn(Schedulers.boundedElastic())
						.then(assembleFromJpa(learnedSongId)) // 저장 후 JPA로 재조회
				);
		});
	}

	/**
	 * 단일 책임: words/expressions/idioms/sentences 테이블을 JPA로 조회해 JSON으로 조립.
	 * 정렬 기준은 ID(생성순) 또는 created_at을 권장.
	 */
	private Mono<ObjectNode> assembleFromJpa(String learnedSongId) {
		return Mono.fromCallable(() -> {
				ObjectNode root = objectMapper.createObjectNode();

				// 정렬 메서드는 Repository에 아래 시그니처를 만들어 두세요.
				root.set("words", objectMapper.valueToTree(
					wordRepository.findAllByLearnedSongId(learnedSongId)));

				root.set("expressions", objectMapper.valueToTree(
					expressionRepository.findAllByLearnedSongId(learnedSongId)));

				root.set("idioms", objectMapper.valueToTree(
					idiomRepository.findAllByLearnedSongId(learnedSongId)));

				root.set("sentences", objectMapper.valueToTree(
					sentenceRepository.findAllByLearnedSongId(learnedSongId)));
				// ↑ 컬럼/필드명 오탈자 주의: sentences_id / expressions_id 등 프로젝트에 맞게 수정

				return root;
			})
			.subscribeOn(Schedulers.boundedElastic());
	}

	// ===== 코어 헬퍼 =====

	/** 실패 시에도 4배열 키를 유지하는 빈 스켈레톤 응답 */
	private ObjectNode emptyResult() {
		ObjectNode r = objectMapper.createObjectNode();
		r.putArray("words");
		r.putArray("expressions");
		r.putArray("idioms");
		r.putArray("sentences");
		return r;
	}

	/** DB 스키마에 맞춘 LLM JSON 스키마(응답 포맷 강제) */
	private ObjectNode buildSchema() {
		ObjectNode schema = objectMapper.createObjectNode();
		schema.put("type", "object");
		ObjectNode propsNode = schema.putObject("properties");

		// words[]
		propsNode.set("words", arrayOf(objectOf(
			prop("word", "string", true),
			prop("phonetic", "string", false),
			prop("meaning", "string", true),
			prop("pos", "string", false),
			prop("examples", "string", false),
			prop("level", "string", false),
			prop("tags", "string", false)
		)));

		// expressions[]
		propsNode.set("expressions", arrayOf(objectOf(
			prop("expression", "string", true),
			prop("meaning", "string", true),
			prop("context", "string", false),
			prop("examples", "string", false),
			prop("tags", "string", false),
			prop("level", "string", false)
		)));

		// idioms[]
		propsNode.set("idioms", arrayOf(objectOf(
			prop("phrase", "string", true),
			prop("meaning", "string", true),
			prop("examples", "string", false),
			prop("level", "string", false),
			prop("tags", "string", false)
		)));

		// sentences[]
		propsNode.set("sentences", arrayOf(objectOf(
			prop("sentence", "string", true),
			prop("translation", "string", true),
			prop("tags", "string", false),
			prop("level", "string", false)
		)));

		ArrayNode required = objectMapper.createArrayNode()
			.add("words").add("expressions").add("idioms").add("sentences");
		schema.set("required", required);
		schema.put("additionalProperties", false);
		return schema;
	}

	// CEFR 허용 레벨(DDL Check와 일치)
	private static final java.util.Set<String> ALLOWED_LEVELS =
		java.util.Set.of("A1", "A2", "B1", "B2", "C1", "C2");

	// 흔한 자연어 표기 → CEFR 매핑(“intermediate” 등)
	private static final java.util.Map<String, String> LEVEL_SYNONYM_MAP = new java.util.HashMap<>() {{
		put("beginner", "A1");
		put("elementary", "A2");
		put("pre-intermediate", "B1");
		put("intermediate", "B1");
		put("upper-intermediate", "B2");
		put("upper intermediate", "B2");
		put("advanced", "C1");
		put("upper-advanced", "C1");
		put("proficient", "C2");
		put("native", "C2");
	}};

	/** CEFR 외 입력을 보정/제거(DB 제약 충족). 반환: 수정/제거 건수 */
	private int normalizeLevels(ObjectNode root) {
		int changed = 0;
		for (String arrName : new String[] {"words", "expressions", "idioms", "sentences"}) {
			JsonNode arr = root.get(arrName);
			if (arr == null || !arr.isArray())
				continue;
			for (JsonNode n : arr) {
				if (!(n instanceof ObjectNode))
					continue;
				ObjectNode obj = (ObjectNode)n;
				JsonNode lv = obj.get("level");
				if (lv == null || !lv.isTextual())
					continue;
				String raw = lv.asText().trim();
				if (raw.isEmpty()) {
					obj.remove("level");
					changed++;
					continue;
				}

				String normalized = normalizeLevelValue(raw);
				if (normalized == null) {
					obj.remove("level");
					changed++;
				} else if (!raw.equals(normalized)) {
					obj.put("level", normalized);
					changed++;
				}
			}
		}
		return changed;
	}

	private String normalizeLevelValue(String v) {
		String s = v.trim();
		String upper = s.toUpperCase();
		if (ALLOWED_LEVELS.contains(upper))
			return upper;                 // A1~C2
		String low = s.toLowerCase();
		if (LEVEL_SYNONYM_MAP.containsKey(low))
			return LEVEL_SYNONYM_MAP.get(low); // 동의어
		String compact = upper.replaceAll("[^A-Z0-9]", "");               // B-1, b 2 등
		if (compact.matches("A[12]|B[12]|C[12]"))
			return compact;
		return null; // 인식 불가 → 삭제
	}

	// ===== 스키마 빌더 유틸 =====

	/** object 스키마 */
	private ObjectNode objectOf(ObjectNode... props) {
		ObjectNode obj = objectMapper.createObjectNode();
		obj.put("type", "object");
		ObjectNode properties = obj.putObject("properties");
		ArrayNode required = objectMapper.createArrayNode();
		for (ObjectNode p : props) {
			String name = p.get("name").asText();
			properties.set(name, p.get("schema"));
			if (p.get("required").asBoolean())
				required.add(name);
		}
		obj.set("required", required);
		obj.put("additionalProperties", false);
		return obj;
	}

	/** 필드 스키마 */
	private ObjectNode prop(String name, String type, boolean required) {
		ObjectNode wrap = objectMapper.createObjectNode();
		wrap.put("name", name);
		ObjectNode schema = objectMapper.createObjectNode();
		schema.put("type", type);
		wrap.set("schema", schema);
		wrap.put("required", required);
		return wrap;
	}

	/** array 스키마 */
	private ObjectNode arrayOf(ObjectNode itemSchema) {
		ObjectNode arr = objectMapper.createObjectNode();
		arr.put("type", "array");
		arr.set("items", itemSchema);
		return arr;
	}

	// ===== 내부 병합기 =====

	/**
	 * Accumulator
	 * - 역할: 청크 응답 누적. 자연키(소문자 비교)로 dedupe하며, 후속 청크 정보로 보강.
	 */
	static final class Accumulator {
		private final ObjectMapper om;
		private final Map<String, ObjectNode> words = new LinkedHashMap<>();
		private final Map<String, ObjectNode> expressions = new LinkedHashMap<>();
		private final Map<String, ObjectNode> idioms = new LinkedHashMap<>();
		private final Map<String, ObjectNode> sentences = new LinkedHashMap<>();

		Accumulator(ObjectMapper om) {
			this.om = om;
		}

		Accumulator accumulate(JsonNode n) {
			addAll(n.path("words"), words, "word");
			addAll(n.path("expressions"), expressions, "expression");
			addAll(n.path("idioms"), idioms, "phrase");
			addAll(n.path("sentences"), sentences, "sentence");
			return this;
		}

		ObjectNode toJson() {
			ObjectNode root = om.createObjectNode();
			root.set("words", mapValues(words));
			root.set("expressions", mapValues(expressions));
			root.set("idioms", mapValues(idioms));
			root.set("sentences", mapValues(sentences));
			return root;
		}

		/** putIfAbsent → merge: 예문/태그 누적, 누락 필드 보완 */
		private void addAll(JsonNode arr, Map<String, ObjectNode> dest, String keyField) {
			if (arr == null || !arr.isArray())
				return;
			for (JsonNode it : arr) {
				if (!it.isObject())
					continue;
				JsonNode keyNode = it.get(keyField);
				if (keyNode == null || !keyNode.isTextual())
					continue;
				String key = keyNode.asText().trim().toLowerCase();
				if (key.isEmpty())
					continue;

				ObjectNode incoming = (ObjectNode)it;
				dest.merge(key, incoming, this::mergeObjects);
			}
		}

		/** 빈 필드 보완 + examples(" | "), tags(", ") 중복제거 누적 */
		private ObjectNode mergeObjects(ObjectNode a, ObjectNode b) {
			copyIfAbsent(a, b, "meaning", "pos", "phonetic", "context", "level", "translation");
			a.put("examples", joinUnique(
				a.hasNonNull("examples") ? a.get("examples").asText() : null,
				b.hasNonNull("examples") ? b.get("examples").asText() : null,
				" | "
			));
			a.put("tags", joinUnique(
				a.hasNonNull("tags") ? a.get("tags").asText() : null,
				b.hasNonNull("tags") ? b.get("tags").asText() : null,
				", "
			));
			return a;
		}

		private void copyIfAbsent(ObjectNode target, ObjectNode src, String... fields) {
			for (String f : fields) {
				if (!target.hasNonNull(f) && src.hasNonNull(f))
					target.set(f, src.get(f));
			}
		}

		private String joinUnique(String a, String b, String sep) {
			boolean A = a == null || a.isBlank(), B = b == null || b.isBlank();
			if (A && B)
				return null;
			java.util.LinkedHashSet<String> set = new java.util.LinkedHashSet<>();
			if (!A)
				for (String s : a.split("\\s*\\Q" + sep + "\\E\\s*"))
					if (!s.isBlank())
						set.add(s.trim());
			if (!B)
				for (String s : b.split("\\s*\\Q" + sep + "\\E\\s*"))
					if (!s.isBlank())
						set.add(s.trim());
			return String.join(sep, set);
		}

		private ArrayNode mapValues(Map<String, ObjectNode> map) {
			ArrayNode a = om.createArrayNode();
			map.values().forEach(a::add);
			return a;
		}
	}
}