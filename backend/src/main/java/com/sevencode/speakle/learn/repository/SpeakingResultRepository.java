package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.SpeakingResultEntity;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpeakingResultRepository extends JpaRepository<SpeakingResultEntity, Long> {
    Optional<SpeakingResultEntity> findBySpeakingIdAndUserId(@NotNull(message = "스피킹 문제 ID는 필수입니다.") Long speakingId, Long userId);
}
