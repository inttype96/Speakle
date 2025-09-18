package com.sevencode.speakle.recommend.repository;

import com.sevencode.speakle.recommend.domain.RecommendationSentence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecommendationSentenceRepository extends JpaRepository<RecommendationSentence, Long> {

    List<RecommendationSentence> findByLearnedSongIdOrderByOrder(Long learnedSongId);

    List<RecommendationSentence> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT rs FROM RecommendationSentence rs WHERE rs.learnedSongId = :learnedSongId AND rs.userId = :userId ORDER BY rs.order")
    List<RecommendationSentence> findByLearnedSongIdAndUserIdOrderByOrder(@Param("learnedSongId") Long learnedSongId, @Param("userId") Long userId);

    void deleteByLearnedSongId(Long learnedSongId);
}