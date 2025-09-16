package com.sevencode.speakle.reward.repository;

import com.sevencode.speakle.reward.domain.entity.PointsLedgerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PointsLedgerRepository extends JpaRepository<PointsLedgerEntity, Long> {
}
