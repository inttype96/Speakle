package com.sevencode.speakle.event.publisher;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sevencode.speakle.event.dto.UserRegisteredMessage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 사용자 이벤트 발행기
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventPublisher {

	public static final String STREAM_KEY = "events:user:registered";

	private final StringRedisTemplate stringRedisTemplate;
	private final ObjectMapper objectMapper;

	/** 사용자 등록 이벤트 발행 (단일 data JSON) */
	public void publishUserRegistered(Long userId, String email, String username, Instant registeredAt) {
		try {
			var payload = new UserRegisteredMessage(userId, email, username, registeredAt, 1);
			var json = objectMapper.writeValueAsString(payload);
			var body = Map.of("data", json);

			var recId = stringRedisTemplate.opsForStream()
				.add(StreamRecords.mapBacked(body).withStreamKey(STREAM_KEY));

			log.info("사용자 등록 이벤트 발행 완료 - userId={}, messageId={}", userId, Objects.requireNonNull(recId).getValue());
		} catch (Exception e) {
			log.error("사용자 등록 이벤트 발행 실패 - userId={}", userId, e);
			throw new IllegalStateException("Failed to publish user-registered event", e);
		}
	}
}
