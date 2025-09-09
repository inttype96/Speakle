package com.sevencode.speakle.common.service;

import java.time.Duration;
import java.util.Optional;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class StateStore {

	private static final String KEY_PREFIX = "oauth:state:";
	private static final Duration EXPIRATION = Duration.ofMinutes(10); // 10분 만료

	private final RedisTemplate<String, Object> redisTemplate;

	/**
	 * state와 userId 매핑을 저장
	 */
	public void save(String state, Long userId) {
		String key = KEY_PREFIX + state;
		redisTemplate.opsForValue().set(key, userId, EXPIRATION);
		log.debug("Saved state: {} for userId: {}", state, userId);
	}

	/**
	 * state를 검증하고 userId를 반환한 후 삭제 (1회성)
	 */
	public Optional<Long> consume(String state) {
		String key = KEY_PREFIX + state;
		Object userId = redisTemplate.opsForValue().getAndDelete(key);

		log.debug("Consumed state: {} for userId: {}", state, userId);
		if (userId instanceof Long) {
			return Optional.of((Long) userId);
		} else if (userId instanceof Integer) {
			return Optional.of(((Integer) userId).longValue());
		}

		log.warn("Invalid or expired state: {}", state);
		return Optional.empty();
	}

	/**
	 * 특정 state 존재 여부 확인
	 */
	public boolean exists(String state) {
		String key = KEY_PREFIX + state;
		return redisTemplate.hasKey(key);
	}

	/**
	 * 특정 state 삭제
	 */
	public void delete(String state) {
		String key = KEY_PREFIX + state;
		redisTemplate.delete(key);
		log.debug("Deleted state: {}", state);
	}
}
