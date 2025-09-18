package com.sevencode.speakle.recommend.service;

import com.sevencode.speakle.recommend.domain.RecommendationSentence;
import com.sevencode.speakle.recommend.repository.RecommendationSentenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationSentenceService {

    private final RecommendationSentenceRepository recommendationSentenceRepository;

    @Transactional
    public void saveRecommendationReason(Long userId, String songId, String reasonSentence) {
        log.info("[RecommendationSentenceService] 추천 이유 저장 - userId={}, songId={}", userId, songId);

        // 기존 추천 이유가 있으면 업데이트, 없으면 생성
        Optional<RecommendationSentence> existing = recommendationSentenceRepository.findByUserIdAndSongId(userId, songId);

        if (existing.isPresent()) {
            // 기존 데이터 삭제 후 새로 생성 (업데이트 대신)
            recommendationSentenceRepository.delete(existing.get());
        }

        RecommendationSentence newReason = RecommendationSentence.builder()
                .userId(userId)
                .songId(songId)
                .reasonSentence(reasonSentence)
                .build();

        recommendationSentenceRepository.save(newReason);
        log.info("[RecommendationSentenceService] 추천 이유 저장 완료 - songId={}", songId);
    }

    public Optional<RecommendationSentence> getRecommendationReason(Long userId, String songId) {
        return recommendationSentenceRepository.findByUserIdAndSongId(userId, songId);
    }

}