package com.sevencode.speakle.recommend.client;

import com.sevencode.speakle.recommend.dto.request.QueryRequest;
import com.sevencode.speakle.recommend.dto.request.RandomSongRequest;
import com.sevencode.speakle.recommend.dto.response.QueryResponse;
import com.sevencode.speakle.recommend.dto.response.RandomSongResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FastApiClient {

    private final RestTemplate restTemplate;

    @Value("${fastapi.url}")
    private String fastApiUrl;

    @Value("${fastapi.random.url:http://localhost:8001/api/recommend/random}")
    private String fastApiRandomUrl;

    public QueryResponse getRecommendations(QueryRequest queryRequest) {
        log.info("FastAPI 요청: url={}, body={}", fastApiUrl, queryRequest);
        try {
            ResponseEntity<QueryResponse> response = restTemplate.postForEntity(
                    fastApiUrl,
                    queryRequest,
                    QueryResponse.class
            );

            QueryResponse body = Optional.ofNullable(response.getBody())
                    .orElseThrow(() -> new RuntimeException("FastAPI 응답이 비어있습니다."));

            log.info(" FastAPI 응답 수신: {} results",
                    body.getResults() != null ? body.getResults().size() : 0);
            return response.getBody();
        } catch (Exception e) {
            log.error("FastAPI 호출 실패: url={}, body={}, error={}",
                    fastApiUrl, queryRequest, e.getMessage(), e);
            throw new RuntimeException("FastAPI 추천 호출 실패", e);
        }
    }

    public RandomSongResponse getRandomSongRecommendation(RandomSongRequest request) {
        log.info("FastAPI 랜덤 노래 요청: url={}, body={}", fastApiRandomUrl, request);
        try {
            ResponseEntity<RandomSongResponse> response = restTemplate.postForEntity(
                    fastApiRandomUrl,
                    request,
                    RandomSongResponse.class
            );

            RandomSongResponse body = Optional.ofNullable(response.getBody())
                    .orElseThrow(() -> new RuntimeException("FastAPI 랜덤 노래 응답이 비어있습니다."));

            log.info("FastAPI 랜덤 노래 응답 수신: songId={}, title={}", body.getSongId(), body.getTitle());
            return body;
        } catch (Exception e) {
            log.error("FastAPI 랜덤 노래 호출 실패: url={}, body={}, error={}",
                    fastApiRandomUrl, request, e.getMessage(), e);
            throw new RuntimeException("FastAPI 랜덤 노래 추천 호출 실패", e);
        }
    }
}
