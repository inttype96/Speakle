package com.sevencode.speakle.recommend.repository;

import com.sevencode.speakle.recommend.domain.RecommendationSentence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RecommendationSentenceRepository extends JpaRepository<RecommendationSentence, Long> {

    Optional<RecommendationSentence> findByUserIdAndSongId(Long userId, String songId);
}