package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.BlankResultEntity;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlankResultRepository extends JpaRepository<BlankResultEntity, Long> {
    Optional<BlankResultEntity> findByBlankIdAndUserId(@NotNull(message = "blankId는 필수입니다.") Long blankId, Long userId);
    List<BlankResultEntity> findByBlankIdInAndUserId(List<Long> blankIds, Long userId);
}
