package com.sevencode.speakle.reward.service;

import com.sevencode.speakle.member.domain.entity.JpaMemberEntity;
import com.sevencode.speakle.member.repository.SpringDataMemberJpa;
import com.sevencode.speakle.reward.domain.entity.PointsAccountEntity;
import com.sevencode.speakle.reward.domain.entity.PointsLedgerEntity;
import com.sevencode.speakle.reward.domain.enums.PointLevel;
import com.sevencode.speakle.reward.dto.request.RewardUpdateRequest;
import com.sevencode.speakle.reward.dto.response.RewardProfileResponse;
import com.sevencode.speakle.reward.dto.response.RewardRankingResponse;
import com.sevencode.speakle.reward.dto.response.RewardUpdateResponse;
import com.sevencode.speakle.reward.exception.*;
import com.sevencode.speakle.reward.repository.PointsAccountRepository;
import com.sevencode.speakle.reward.repository.PointsLedgerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RewardServiceImpl implements RewardService{

    private final PointsAccountRepository pointsAccountRepository;
    private final PointsLedgerRepository pointsLedgerRepository;
    private final SpringDataMemberJpa userRepository;

    /**
     * 포인트 업데이트
     */
    @Override
    @Transactional
    public RewardUpdateResponse updateReward(RewardUpdateRequest request, Long userId) {
        // 1. source 및 refType 유효성 검사
        PointsLedgerEntity.SourceType sourceType = parseSourceType(request.getSource());
        PointsLedgerEntity.RefType refType = parseRefType(request.getRefType());

        // 2. 사용자 포인트 계정 조회 또는 생성 (비관적 락 적용)
        PointsAccountEntity account = getOrCreatePointsAccount(request.getUserId());

        // 3. 포인트 업데이트
        int newBalance = account.getBalance() + request.getDelta();
        if (newBalance < 0) {
            throw new InsufficientPointsException("포인트 잔액이 부족합니다.");
        }

        // 4. 새로운 레벨 계산
        PointLevel newLevel = PointLevel.fromPoints(newBalance);

        // 5. 계정 업데이트
        PointsAccountEntity updatedAccount = PointsAccountEntity.builder()
                .userId(account.getUserId())
                .balance(newBalance)
                .level(newLevel)
                .updatedAt(LocalDateTime.now())
                .build();

        PointsAccountEntity savedAccount = pointsAccountRepository.save(updatedAccount);

        Map<String, Object> metaData = new HashMap<>();
        metaData.put("source", request.getSource());
        metaData.put("refType", request.getRefType());
        metaData.put("refId", request.getRefId());

        // 6. 포인트 이력 기록
        PointsLedgerEntity ledger = PointsLedgerEntity.builder()
                .userId(request.getUserId())
                .delta(request.getDelta())
                .source(sourceType)
                .refType(refType)
                .refId(request.getRefId())
                .meta(metaData)
                .build();

        pointsLedgerRepository.save(ledger);

        return RewardUpdateResponse.builder()
                .userId(savedAccount.getUserId())
                .balance(savedAccount.getBalance())
                .level(savedAccount.getLevel())
                .updatedAt(savedAccount.getUpdatedAt())
                .build();
    }

    // ------------------------------------------------------------
    // SourceType으로 파싱
    // ------------------------------------------------------------
    private PointsLedgerEntity.SourceType parseSourceType(String source) {
        try {
            return PointsLedgerEntity.SourceType.valueOf(source.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidSourceTypeException("유효하지 않은 source 타입입니다: " + source);
        }
    }

    // ------------------------------------------------------------
    // RefType으로 파싱
    // ------------------------------------------------------------
    private PointsLedgerEntity.RefType parseRefType(String refType) {
        if (refType == null || refType.trim().isEmpty()) {
            return null;
        }
        try {
            return PointsLedgerEntity.RefType.valueOf(refType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidRefTypeException("유효하지 않은 refType 타입입니다: " + refType);
        }
    }

    // ------------------------------------------------------------
    // 사용자 포인트 계정 조회 또는 생성
    // ------------------------------------------------------------
    private PointsAccountEntity getOrCreatePointsAccount(Long userId) {
        return pointsAccountRepository.findByUserIdWithLock(userId)
                .orElseGet(() -> createNewPointsAccount(userId));
    }

    // ------------------------------------------------------------
    // 사용자 포인트 계정 생성
    // ------------------------------------------------------------
    private PointsAccountEntity createNewPointsAccount(Long userId) {
        PointsAccountEntity newAccount = PointsAccountEntity.builder()
                .userId(userId)
                .balance(0)
                .level(PointLevel.BRONZE)
                .build();

        return pointsAccountRepository.save(newAccount);
    }

    /**
     * 포인트 조회
     */
    @Override
    public RewardProfileResponse getPointProfile(Long userId) {
        log.info("포인트 프로필 조회 요청 - userId: {}", userId);

        PointsAccountEntity pointsAccount = (PointsAccountEntity) pointsAccountRepository.findByUserId(userId)
                .orElseThrow(() -> {
                    return new UserNotFoundException("사용자를 찾을 수 없습니다.");
                });

        return RewardProfileResponse.builder()
                .userId(pointsAccount.getUserId())
                .balance(pointsAccount.getBalance())
                .level(pointsAccount.getLevel())
                .build();
    }

    /**
     * 포인트 랭킹 조회
     */
    @Override
    public List<RewardRankingResponse> getTop5PointRanking() {
        try {
            // 1. 상위 5명 포인트 계정 조회
            List<PointsAccountEntity> result = pointsAccountRepository.getTop5NonDeletedUsersRanking();

            if (result.isEmpty() || result.size() < 5) {
                throw new InsufficientRankingDataException("현재 랭킹 목록의 사이즈가 "+result.size()+"입니다.(5명이 되지 않습니다.)");
            }

            // 2. 사용자 ID 추출
            List<Long> userIds = result.stream()
                    .map(PointsAccountEntity::getUserId)
                    .collect(Collectors.toList());

            // 3. 사용자 정보 한번에 조회
            List<JpaMemberEntity> users = userRepository.findByIdIn(userIds);
            Map<Long, JpaMemberEntity> userMap = users.stream()
                    .collect(Collectors.toMap(
                            JpaMemberEntity::getId,
                            Function.identity(),
                            (existing, replacement) -> existing  // 중복 키 처리
                    ));

            // 4. Builder를 사용해서 DTO로 변환
            return IntStream.range(0, result.size())
                    .mapToObj(i -> {
                        PointsAccountEntity account = result.get(i);
                        JpaMemberEntity user = userMap.get(account.getUserId());

                        return RewardRankingResponse.builder()
                                .rank(i + 1)                                              // 순위 (1부터 시작)
                                .userId(account.getUserId())                              // 사용자 ID
                                .username(user != null ? user.getUsername() : "알 수 없는 사용자") // 사용자명
                                .profileImageUrl(user != null ? user.getProfileImageUrl() : null) // 프로필 이미지
                                .points(account.getBalance())                             // 포인트
                                .build();
                    })
                    .collect(Collectors.toList());

        } catch (InsufficientRankingDataException e) {
            throw e;
        } catch (Exception e) {
            throw new PointRankingException("상위 5명 랭킹 조회 중 오류 발생");
        }
    }
}