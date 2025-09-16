package com.sevencode.speakle.reward.repository;

import com.sevencode.speakle.reward.domain.entity.PointsAccountEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PointsAccountRepository extends JpaRepository<PointsAccountEntity, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PointsAccountEntity p WHERE p.userId = :userId")
    Optional<PointsAccountEntity> findByUserIdWithLock(@Param("userId") Long userId);
}
