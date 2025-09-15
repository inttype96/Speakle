package com.sevencode.speakle.learn.client;

import com.sevencode.speakle.learn.dto.request.EtriPronunciationRequest;
import com.sevencode.speakle.learn.dto.response.EtriPronunciationResponse;
import com.sevencode.speakle.learn.exception.PronunciationServerException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
@RequiredArgsConstructor
@Slf4j
public class EtriPronunciationClient {
    private final WebClient webClient;

    @Value("${etri.api.url}")
    private String etriApiUrl;

    @Value("${etri.api.key}")
    private String etriApiKey;

    /**
     * ETRI 발음 평가 API 호출
     * @param script 평가할 스크립트
     * @param audioBase64 Base64 인코딩된 오디오 데이터
     * @return 발음 평가 결과
     */
    public Mono<EtriPronunciationResponse> evaluatePronunciation(String script, String audioBase64) {
        // ETRI API 요청 생성
        EtriPronunciationRequest request = EtriPronunciationRequest.builder()
                .requestId("reserved field")
                .argument(EtriPronunciationRequest.EtriArgument.builder()
                        .languageCode("english")
                        .script(script)
                        .audio(audioBase64)
                        .build())
                .build();

        return webClient.post()
                .uri(etriApiUrl)
                .header("Authorization", etriApiKey)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(EtriPronunciationResponse.class)
                .timeout(Duration.ofSeconds(30))
                .doOnSuccess(response -> log.info("ETRI API 호출 성공: result={}", response.getResult()))
                .doOnError(error -> log.error("ETRI API 호출 실패", error))
                .onErrorMap(WebClientResponseException.class, ex -> {
                    log.error("ETRI API 호출 중 HTTP 에러 발생. Status: {}, Body: {}",
                            ex.getStatusCode(), ex.getResponseBodyAsString());
                    return new PronunciationServerException("발음 평가 서버 호출 실패");
                })
                .onErrorMap(Exception.class, ex -> {
                    if (!(ex instanceof RuntimeException)) {
                        log.error("ETRI API 호출 중 예상치 못한 에러 발생", ex);
                        return new PronunciationServerException("발음 평가 서버 호출 실패");
                    }
                    return ex;
                });
    }
}
