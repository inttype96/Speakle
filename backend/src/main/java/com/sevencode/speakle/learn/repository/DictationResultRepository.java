package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.DictationResultEntity;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DictationResultRepository extends JpaRepository<DictationResultEntity, Long> {
    Optional<DictationResultEntity> findByDictationIdAndUserId(@NotNull(message = "딕테이션 ID는 필수입니다.") Long dictationId, @NotNull(message = "사용자 ID는 필수입니다.") Long userId);
}
