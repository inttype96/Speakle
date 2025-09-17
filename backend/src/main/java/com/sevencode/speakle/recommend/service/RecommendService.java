package com.sevencode.speakle.recommend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sevencode.speakle.recommend.client.FastApiClient;
import com.sevencode.speakle.recommend.client.GMSAiClient;
import com.sevencode.speakle.recommend.domain.Recommendation;
import com.sevencode.speakle.recommend.domain.RecommendationLog;
import com.sevencode.speakle.recommend.dto.request.HybridRecommendRequest;
import com.sevencode.speakle.recommend.dto.response.KeywordsResponse;
import com.sevencode.speakle.recommend.dto.request.QueryRequest;
import com.sevencode.speakle.recommend.dto.response.QueryResponse;
import com.sevencode.speakle.recommend.dto.response.RecommendResponse;
import com.sevencode.speakle.recommend.repository.RecommendationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendService {

    private final FastApiClient fastApiClient;
    private final GMSAiClient gmsAiClient;
    private final RecommendationLogRepository logRepository;
    private final ObjectMapper objectMapper;

    /* 상황 + 장소 기반 추천 hybrid */
    public RecommendResponse recommendHybrid(Long userId, HybridRecommendRequest request) {
        // 1. LLM에서 keywords + phrases + top_k 생성
        KeywordsResponse keywords = gmsAiClient.generateKeywords(
                request.getSituation(),
                request.getLocation(),
                "gpt-4o"
        );

        // 2. FastAPI 요청
        QueryRequest queryRequest = QueryRequest.builder()
                .words(keywords.getWords())
                .phrases(keywords.getPhrases())
                .topK(request.getLimit() > 0 ? request.getLimit() : 50)  // limit 사용 또는 기본값 50
                .build();

        QueryResponse queryResponse = fastApiClient.getRecommendations(queryRequest);

        // 3. 로그 저장
        RecommendationLog log = RecommendationLog.builder()
                .userId(userId)
                .query(request.getSituation() + " @ " + request.getLocation())
                .candidateSongIds(
                        queryResponse.getResults()
                                .stream()
                                .map(Recommendation::getSongId)
                                .collect(Collectors.toList())
                )
                .algoVersion("hybrid-v1")
                .meta(toJson(queryResponse))
                .build();

        logRepository.save(log);

        // 4. 최종 응답 반환
        return new RecommendResponse(
                queryResponse.getResults()
                        .stream()
                        .map(Recommendation::getSongId)
                        .toList(),
                keywords
        );
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 직렬화 실패", e);
        }
    }
}
