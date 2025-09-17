package com.sevencode.speakle.reward.service;

import com.sevencode.speakle.member.repository.SpringDataMemberJpa;
import com.sevencode.speakle.reward.domain.entity.PointsAccountEntity;
import com.sevencode.speakle.reward.domain.enums.PointLevel;
import com.sevencode.speakle.reward.exception.PointsAccountNotFoundException;
import com.sevencode.speakle.reward.exception.UserNotFoundException;
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
    private final SpringDataMemberJpa memberRepository;

    /**
     * 포인트 계정 확보 (없으면 생성)
     */
    @Transactional
    public void ensurePointsAccount(Long userId) {
        // 1. 기본 유효성 검사 (null, 음수 체크)
        validateUserId(userId);

        // 2. 포인트 계정 존재 여부 확인
        if (!pointsAccountRepository.existsByUserId(userId)) {
            // 3. 계정이 없을 때만 사용자 존재 여부 확인 (DB 호출 최소화)
            validateUserExists(userId);

            // 4. 포인트 계정 생성
            createPointsAccount(userId);
        }
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

    // === Private Helper Methods ===

    /**
     * 사용자 ID 유효성 검증 (성능 최적화)
     */
    private void validateUserId(Long userId) {
        // 1. 기본 유효성 검사 (DB 호출 없음)
        if (userId == null) {
            throw new IllegalArgumentException("사용자 ID는 null일 수 없습니다.");
        }

        if (userId <= 0) {
            throw new IllegalArgumentException("사용자 ID는 양수여야 합니다.");
        }
    }

    /**
     * 사용자 존재 여부 확인
     */
    private void validateUserExists(Long userId) {
        if (!memberRepository.existsById(userId)) {
            throw new UserNotFoundException("존재하지 않는 사용자입니다: " + userId);
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
}
