package com.sevencode.speakle.reward.service;

import com.sevencode.speakle.reward.domain.entity.PointsAccountEntity;
import com.sevencode.speakle.reward.domain.enums.PointLevel;
import com.sevencode.speakle.reward.exception.PointsAccountNotFoundException;
import com.sevencode.speakle.reward.repository.PointsAccountRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PointsAccountHelper {
    private final PointsAccountRepository pointsAccountRepository;

    /**
     * 포인트 계정 확보 (없으면 생성)
     */
    @Transactional
    public void ensurePointsAccount(Long userId) {
        if (!pointsAccountRepository.existsByUserId(userId)) {
            createPointsAccount(userId);
        }
    }

    /**
     * 포인트 계정 생성
     */
    private void createPointsAccount(Long userId) {
        PointsAccountEntity newAccount = PointsAccountEntity.builder()
                .userId(userId)
                .balance(0)
                .level(PointLevel.BRONZE)
                .build();
        pointsAccountRepository.save(newAccount);
    }

    /**
     * 포인트 계정 조회 (락 적용)
     */
    @Transactional
    public PointsAccountEntity getPointsAccountWithLock(Long userId) {
        ensurePointsAccount(userId); // 계정 확보
        return pointsAccountRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new PointsAccountNotFoundException("포인트 계정을 찾을 수 없습니다."));
    }

    /**
     * 포인트 계정 조회 (일반)
     */
    @Transactional
    public PointsAccountEntity getPointsAccount(Long userId) {
        ensurePointsAccount(userId); // 계정 확보
        return (PointsAccountEntity) pointsAccountRepository.findByUserId(userId)
                .orElseThrow(() -> new PointsAccountNotFoundException("포인트 계정을 찾을 수 없습니다."));
    }
}
