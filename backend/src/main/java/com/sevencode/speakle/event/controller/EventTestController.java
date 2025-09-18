package com.sevencode.speakle.event.controller;

import com.sevencode.speakle.event.publisher.UserEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;

@Slf4j
@RestController
@RequestMapping("/api/event/test")
@RequiredArgsConstructor
public class EventTestController {

    private final UserEventPublisher eventPublisher;
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 테스트용 사용자 등록 이벤트 발행
     */
    @PostMapping("/user-registered")
    public Map<String, Object> testUserRegisteredEvent(
            @RequestParam Long userId,
            @RequestParam String username,
            @RequestParam(defaultValue = "test@example.com") String email) {

        log.info("테스트 이벤트 발행 - userId: {}, username: {}, email: {}", userId, username, email);

        try {
            eventPublisher.publishUserRegistered(userId, username, email, Instant.parse("2020-02-20"));
            return Map.of(
                    "success", true,
                    "message", "이벤트 발행 완료",
                    "userId", userId,
                    "username", username,
                    "email", email
            );
        } catch (Exception e) {
            log.error("테스트 이벤트 발행 실패", e);
            return Map.of(
                    "success", false,
                    "message", "이벤트 발행 실패: " + e.getMessage(),
                    "error", e.getClass().getSimpleName()
            );
        }
    }

    /**
     * Redis Stream 상태 확인
     */
    @GetMapping("/redis-status")
    public Map<String, Object> checkRedisStatus() {
        try {
            // Redis 연결 확인
            String ping = redisTemplate.getConnectionFactory().getConnection().ping();

            // Stream 존재 여부 확인
            String streamKey = com.sevencode.speakle.event.publisher.UserEventPublisher.STREAM_KEY;
            boolean streamExists = redisTemplate.hasKey(streamKey);

            // Stream 길이 확인
            Long streamLength = streamExists ? redisTemplate.opsForStream().size(streamKey) : 0;

            return Map.of(
                    "redis_ping", Objects.requireNonNull(ping),
                    "stream_exists", streamExists,
                    "stream_length", streamLength,
                    "stream_key", streamKey,
                    "consumer_group", com.sevencode.speakle.config.redis.RedisStreamsConfig.GROUP
            );
        } catch (Exception e) {
            log.error("Redis 상태 확인 실패", e);
            return Map.of(
                    "error", e.getMessage(),
                    "error_type", e.getClass().getSimpleName()
            );
        }
    }

    /**
     * Consumer Group 정보 확인
     */
    @GetMapping("/consumer-info")
    public Map<String, Object> getConsumerInfo() {
        try {
            String streamKey = com.sevencode.speakle.event.publisher.UserEventPublisher.STREAM_KEY;
            String groupName = com.sevencode.speakle.config.redis.RedisStreamsConfig.GROUP;

            // Consumer Group 정보 조회
            var groupInfo = redisTemplate.opsForStream().groups(streamKey);

            // Pending 메시지 확인
            var pendingInfo = redisTemplate.opsForStream().pending(streamKey, groupName);

            return Map.of(
                    "stream_key", streamKey,
                    "consumer_group", groupName,
                    "groups_info", groupInfo.toString(),
                    "pending_messages", pendingInfo != null ? pendingInfo.getTotalPendingMessages() : 0,
                    "pending_info", pendingInfo != null ? pendingInfo.toString() : "No pending info"
            );
        } catch (Exception e) {
            log.error("Consumer 정보 확인 실패", e);
            return Map.of(
                    "error", e.getMessage(),
                    "error_type", e.getClass().getSimpleName()
            );
        }
    }

    /**
     * Consumer Group과 Stream 초기화 (문제 해결용)
     */
    @PostMapping("/reset-consumer-group")
    public Map<String, Object> resetConsumerGroup() {
        try {
            String streamKey = com.sevencode.speakle.event.publisher.UserEventPublisher.STREAM_KEY;
            String groupName = com.sevencode.speakle.config.redis.RedisStreamsConfig.GROUP;

            log.info("Consumer Group 초기화 시작");

            // Consumer Group 삭제
            try {
                redisTemplate.opsForStream().destroyGroup(streamKey, groupName);
                log.info("기존 Consumer Group 삭제됨: {}", groupName);
            } catch (Exception e) {
                log.warn("Consumer Group 삭제 실패 (존재하지 않을 수 있음): {}", e.getMessage());
            }

            // Consumer Group 재생성 (ReadOffset.latest()로 새 메시지만 처리)
            redisTemplate.opsForStream().createGroup(streamKey, org.springframework.data.redis.connection.stream.ReadOffset.latest(), groupName);
            log.info("Consumer Group 재생성됨: {}", groupName);

            return Map.of(
                    "success", true,
                    "message", "Consumer Group이 초기화되었습니다",
                    "stream_key", streamKey,
                    "consumer_group", groupName
            );
        } catch (Exception e) {
            log.error("Consumer Group 초기화 실패", e);
            return Map.of(
                    "success", false,
                    "error", e.getMessage(),
                    "error_type", e.getClass().getSimpleName()
            );
        }
    }
}
