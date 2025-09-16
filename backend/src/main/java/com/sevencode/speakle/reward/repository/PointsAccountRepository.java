package com.sevencode.speakle.reward.repository;

import com.sevencode.speakle.reward.domain.entity.PointsAccountEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PointsAccountRepository extends JpaRepository<PointsAccountEntity, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PointsAccountEntity p WHERE p.userId = :userId")
    Optional<PointsAccountEntity> findByUserIdWithLock(@Param("userId") Long userId);
    Optional<Object> findByUserId(Long userId);

    @Query(value = """
        SELECT pa.*
        FROM points_accounts pa
        INNER JOIN users u ON pa.user_id = u.user_id
        WHERE u.is_deleted = false
        ORDER BY pa.balance DESC
        LIMIT 5
        """, nativeQuery = true)
    List<PointsAccountEntity> getTop5NonDeletedUsersRanking();
}
