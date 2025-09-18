package com.sevencode.speakle.support;

import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sevencode.speakle.event.dto.UserRegisteredMessage;
import com.sevencode.speakle.playlist.service.CustomPlaylistService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * DLQ 재처리기
 * - 고정 딜레이 폴링
 * - 지수 백오프(2^n 초)
 * - 최대 재시도 초과 시 DEAD 큐로 이동
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FailedMessageProcessor {

	private static final String DLQ_KEY  = "dlq:events:user:registered";
	private static final String DEAD_KEY = "dead:events:user:registered";
	private static final int MAX_RETRY   = 5;

	private static final String DEFAULT_DESC = "회원가입 시 자동 생성된 기본 플레이리스트";

	private final StringRedisTemplate stringRedisTemplate;
	private final ObjectMapper objectMapper;
	private final CustomPlaylistService playlistService;

	@Scheduled(fixedDelay = 5000)
	public void retryDlq() {
		String item = stringRedisTemplate.opsForList().leftPop(DLQ_KEY);
		if (item == null) return;

		try {
			var info = objectMapper.readValue(item, FailedMessageInfo.class);
			var msg  = objectMapper.readValue(info.payload(), UserRegisteredMessage.class);

			Long userId    = msg.userId();
			String name    = buildDefaultName(msg.username());

			// 멱등성: 이미 있으면 스킵
			if (playlistService.hasDefaultPlaylist(userId)) {
				log.info("[DLQ-SKIP] 기본 플레이리스트 이미 존재 - userId={}, messageId={}", userId, info.messageId());
				return;
			}

			// 재처리: 기본 플레이리스트 생성
			playlistService.createDefaultPlaylist(userId, name, DEFAULT_DESC);
			log.info("DLQ 재처리 성공 - userId={}, messageId={}", userId, info.messageId());

		} catch (Exception e) {
			requeueOrDead(item, e);
		}
	}

	private void requeueOrDead(String item, Exception cause) {
		try {
			var info = objectMapper.readValue(item, FailedMessageInfo.class);
			int next = info.retryCount() + 1;

			if (next > MAX_RETRY) {
				stringRedisTemplate.opsForList().rightPush(DEAD_KEY, item);
				log.error("DLQ 재처리 실패(최대 초과) - messageId={}, deadKey={}", info.messageId(), DEAD_KEY, cause);
				return;
			}

			// 지수 백오프
			try {
				Thread.sleep(Duration.ofSeconds((long) Math.pow(2, next)).toMillis());
			} catch (InterruptedException ie) {
				Thread.currentThread().interrupt();
			}

			// retryCount 갱신 후 재삽입
			var updated = new FailedMessageInfo(
				info.streamKey(), info.group(), info.messageId(),
				info.payload(), cause.getMessage(), info.stackTrace(),
				next, info.firstFailedAt(), java.time.Instant.now(), info.version()
			);
			stringRedisTemplate.opsForList().rightPush(DLQ_KEY, write(updated));
			log.warn("DLQ 재삽입(nextRetry={}) - messageId={}", next, info.messageId());

		} catch (Exception wrap) {
			log.error("DLQ 재삽입/DEAD 이동 처리 실패", wrap);
		}
	}

	private String write(Object o) {
		try { return objectMapper.writeValueAsString(o); }
		catch (Exception e) { throw new RuntimeException(e); }
	}

	private String buildDefaultName(String username) {
		if (username == null || username.isBlank()) return "기본 플레이리스트";
		return username + "님의 첫 번째 플레이리스트";
	}
}
