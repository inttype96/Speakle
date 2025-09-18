package com.sevencode.speakle.recommend.service;

import com.sevencode.speakle.recommend.domain.RecommendationSentence;
import com.sevencode.speakle.recommend.repository.RecommendationSentenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationSentenceService {

    private final RecommendationSentenceRepository recommendationSentenceRepository;

    @Transactional
    public void saveRecommendedSentences(Long userId, Long learnedSongId, List<String> coreSentences, List<String> koreanTranslations) {
        log.info("[RecommendationSentenceService] 추천 문장 저장 시작 - userId={}, learnedSongId={}, sentences={}",
                userId, learnedSongId, coreSentences.size());

        // 기존 추천 문장 삭제 (같은 learnedSongId)
        recommendationSentenceRepository.deleteByLearnedSongId(learnedSongId);

        // 새로운 추천 문장들 저장
        for (int i = 0; i < coreSentences.size(); i++) {
            String coreSentence = coreSentences.get(i);
            String korean = (koreanTranslations != null && i < koreanTranslations.size())
                    ? koreanTranslations.get(i) : null;

            RecommendationSentence sentence = RecommendationSentence.builder()
                    .userId(userId)
                    .learnedSongId(learnedSongId)
                    .coreSentence(coreSentence)
                    .korean(korean)
                    .order((long) (i + 1))
                    .build();

            recommendationSentenceRepository.save(sentence);
        }

        log.info("[RecommendationSentenceService] 추천 문장 저장 완료 - 총 {}개", coreSentences.size());
    }

    public List<RecommendationSentence> getRecommendedSentences(Long learnedSongId) {
        log.info("[RecommendationSentenceService] 추천 문장 조회 - learnedSongId={}", learnedSongId);
        return recommendationSentenceRepository.findByLearnedSongIdOrderByOrder(learnedSongId);
    }

    public List<RecommendationSentence> getUserRecommendationHistory(Long userId) {
        log.info("[RecommendationSentenceService] 사용자 추천 이력 조회 - userId={}", userId);
        return recommendationSentenceRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void deleteRecommendedSentences(Long learnedSongId) {
        log.info("[RecommendationSentenceService] 추천 문장 삭제 - learnedSongId={}", learnedSongId);
        recommendationSentenceRepository.deleteByLearnedSongId(learnedSongId);
    }
}