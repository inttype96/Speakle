package com.sevencode.speakle.recommend.repository;

import com.sevencode.speakle.recommend.domain.RecommendationLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecommendationLogRepository extends JpaRepository<RecommendationLog, Long> {
}
