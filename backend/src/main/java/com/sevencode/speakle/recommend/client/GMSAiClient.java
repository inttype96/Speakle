package com.sevencode.speakle.recommend.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sevencode.speakle.recommend.dto.response.KeywordsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class GMSAiClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String RESPONSE_FORMAT_KEY = "response_format";
    private static final String RESPONSE_FORMAT_TYPE = "json_object";

    @Value("${gms.url}")
    private String openaiApiUrl;

    /**
     * situation + location을 받아서 LLMKeywords 생성
     */
    public KeywordsResponse generateKeywords(String situation, String location, String model) {
        String prompt = String.format(
                "**중요: 사용자가 입력한 '%s'와 '%s'를 영어로 번역한 단어는 반드시 words 배열의 맨 앞에 포함시켜야 합니다.**\n\n" +
                        "%s에서 %s 상황에서 사용하는 가장 중요한 영어단어와 영어표현을 JSON 형식으로 출력해줘.\n\n" +
                        "규칙:\n" +
                        "1. **필수**: '%s'와 '%s'를 영어로 번역한 단어를 words 배열 맨 앞에 무조건 포함\n" +
                        "2. 추가로 난이도 있는 단어 2개, 일상에서 자주 쓰는 단어 18개 포함 (총 20개 이상)\n" +
                        "3. phrases는 한국인들이 꼭 배워야 하는 원어민 표현 20개\n" +
                        "4. 반드시 아래 JSON 형식을 따를 것:\n\n" +
                        "{ \"words\": [\"location 영어번역\", \"situation 영어번역\", \"word1\", ...], \"phrases\": [\"phrase1\", ...] }",
                location, situation, location, situation, location, situation
        );

        log.info("GMS(OpenAI) 요청: model={}, prompt={}", model, prompt);

        String rawJson = callOpenAI(model, prompt);
        try {
            KeywordsResponse keywords = objectMapper.readValue(rawJson, KeywordsResponse.class);
            log.info("LLM 키워드 생성 성공: words={}, phrases={}",
                    keywords.getWords().size(), keywords.getPhrases().size());
            return keywords;
        } catch (Exception e) {
            log.error(" LLM 응답 파싱 실패: rawJson={}", rawJson, e);
            throw new RuntimeException("LLM 응답 파싱 실패: " + rawJson, e);
        }
    }

    private String callOpenAI(String model, String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Authorization 헤더는 인터셉터에서 자동 추가됨

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
                Map.of("role", "system", "content", "You are a helpful assistant."),
                Map.of("role", "user", "content", prompt)
        ));
        // JSON 응답 강제
        body.put(RESPONSE_FORMAT_KEY, Map.of("type", RESPONSE_FORMAT_TYPE));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response =
                    restTemplate.postForEntity(openaiApiUrl, request, Map.class);

            if (response.getBody() == null) {
                throw new RuntimeException("GMS 응답이 비어 있습니다.");
            }

            List<Map<String, Object>> choices =
                    (List<Map<String, Object>>) response.getBody().get("choices");

            String content = (String) ((Map<String, Object>) choices.get(0).get("message")).get("content");

            log.debug("GMS 응답 원문: {}", content);

            return content;

        } catch (Exception e) {
            log.error("OpenAI 모델 {} 호출 실패: {}", model, e.getMessage(), e);

            // fallback
            if (!"gpt-4o-mini".equals(model)) {
                log.warn("모델 {} 실패 → gpt-4o-mini로 재시도", model);
                return callOpenAI("gpt-4o-mini", prompt);
            }
            throw new RuntimeException("모든 모델 호출 실패", e);
        }
    }
}
