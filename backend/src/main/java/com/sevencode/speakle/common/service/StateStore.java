package com.sevencode.speakle.common.service;

import java.time.Duration;
import java.util.Optional;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.sevencode.speakle.common.exception.StateStoreException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class StateStore {

	private static final String KEY_PREFIX = "oauth:state:";
	private static final Duration EXPIRATION = Duration.ofMinutes(10); // 10분 만료
	private static final int MAX_RETRY_ATTEMPTS = 3;
	private static final String STATE_PREFIX = "SPOTIFY_";

	private final RedisTemplate<String, Object> redisTemplate;

	/**
	 * state와 userId 매핑을 저장
	 */
	public void save(String state, Long userId) {
		if (state == null || state.trim().isEmpty()) {
			throw StateStoreException.emptyInput("OAuth state 값이 비어있습니다.");
		}
		if (userId == null) {
			throw StateStoreException.emptyInput("사용자 ID가 비어있습니다.");
		}

		try {
			String key = KEY_PREFIX + state;
			redisTemplate.opsForValue().set(key, userId, EXPIRATION);
			log.debug("OAuth state 저장 완료 - state: {}, userId: {}", state, userId);
		} catch (Exception e) {
			log.error("OAuth state 저장 실패 - state: {}, userId: {}, 오류: {}", state, userId, e.getMessage());
			throw StateStoreException.saveFailed("OAuth state 저장에 실패했습니다.", e);
		}
	}

	/**
	 * state를 검증하고 userId를 반환한 후 삭제 (1회성)
	 */
	public Optional<Long> consume(String state) {
		if (state == null || state.trim().isEmpty()) {
			log.warn("잘못된 OAuth state 요청 - 빈 값");
			return Optional.empty();
		}

		try {
			String key = KEY_PREFIX + state;
			Object userId = redisTemplate.opsForValue().getAndDelete(key);

			if (userId == null) {
				log.warn("유효하지 않거나 만료된 OAuth state: {}", state);
				return Optional.empty();
			}

			Long parsedUserId = parseUserId(userId);
			if (parsedUserId != null) {
				log.debug("OAuth state 검증 완료 - state: {}, userId: {}", state, parsedUserId);
				return Optional.of(parsedUserId);
			} else {
				log.warn("OAuth state에서 잘못된 사용자 ID 형식 - state: {}, userId: {}", state, userId);
				return Optional.empty();
			}

		} catch (Exception e) {
			log.error("OAuth state 검증 중 오류 발생 - state: {}, 오류: {}", state, e.getMessage());
			return Optional.empty();
		}
	}

	/**
	 * 특정 state 존재 여부 확인
	 */
	public boolean exists(String state) {
		if (state == null || state.trim().isEmpty()) {
			return false;
		}

		try {
			String key = KEY_PREFIX + state;
			return redisTemplate.hasKey(key);
		} catch (Exception e) {
			log.error("OAuth state 존재 여부 확인 중 오류 - state: {}, 오류: {}", state, e.getMessage());
			return false;
		}
	}

	/**
	 * 특정 state 삭제
	 */
	public void delete(String state) {
		if (state == null || state.trim().isEmpty()) {
			return;
		}

		try {
			String key = KEY_PREFIX + state;
			redisTemplate.delete(key);
			log.debug("OAuth state 삭제 완료 - state: {}", state);
		} catch (Exception e) {
			log.error("OAuth state 삭제 중 오류 - state: {}, 오류: {}", state, e.getMessage());
		}
	}

	/**
	 * 만료된 state들을 정리 (선택적)
	 */
	public void cleanupExpiredStates() {
		try {
			// Redis TTL에 의해 자동으로 정리되므로 별도 구현 불필요
			log.debug("만료된 OAuth state들은 Redis TTL에 의해 자동 정리됩니다.");
		} catch (Exception e) {
			log.error("만료된 OAuth state 정리 중 오류: {}", e.getMessage());
		}
	}

	/**
	 * userId 파싱 헬퍼 메서드
	 */
	private Long parseUserId(Object userId) {
		if (userId instanceof Long) {
			return (Long) userId;
		} else if (userId instanceof Integer) {
			return ((Integer) userId).longValue();
		} else if (userId instanceof String) {
			try {
				return Long.parseLong((String) userId);
			} catch (NumberFormatException e) {
				log.warn("문자열 형태의 userId 파싱 실패: {}", userId);
				return null;
			}
		}
		return null;
	}
}
