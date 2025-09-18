package com.sevencode.speakle.event.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sevencode.speakle.event.dto.UserRegisteredMessage;
import com.sevencode.speakle.event.publisher.UserEventPublisher;
import com.sevencode.speakle.playlist.service.CustomPlaylistService;
import com.sevencode.speakle.support.FailedMessagePusher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PlaylistEventConsumer {

	public static final String GROUP = "playlist-service-v3";
	private static final String DEFAULT_DESC = "가입 시 자동 생성된 기본 플레이리스트";

	private final ObjectMapper objectMapper;
	private final RedisTemplate<String, String> redisTemplate;
	private final CustomPlaylistService playlistService;
	private final FailedMessagePusher failedMessagePusher;

	/** MapRecord<String,String,String> 으로 통일 */
	public void onMessage(MapRecord<String, String, String> record) {
		log.info("===== Consumer 메시지 수신됨 =====");
		log.info("Record ID: {}", record.getId());
		log.info("Record value: {}", record.getValue());
		try {
			var map = record.getValue();
			var json = map.get("data");
			if (json == null) {
				throw new IllegalArgumentException("Missing 'data' field in stream message");
			}

			var msg = objectMapper.readValue(json, UserRegisteredMessage.class);
			Long userId = msg.userId();
			String playlistName = buildDefaultName(msg.username());

			// ✅ 멱등 처리: 이미 있으면 건너뜀
			if (playlistService.hasDefaultPlaylist(userId)) {
				log.info("[SKIP] 기본 플레이리스트가 이미 존재 - userId={}", userId);
				ack(record);
				return;
			}

			playlistService.createDefaultPlaylist(userId, playlistName, DEFAULT_DESC);

			ack(record);
			log.info("기본 플레이리스트 생성 완료 - userId={}, messageId={}",
				userId, record.getId().getValue());

		} catch (Exception ex) {
			log.error("기본 플레이리스트 생성 실패 - messageId: {}, error: {}",
				record.getId().getValue(), ex.getMessage());
			// 실패: DLQ로 복사 후 원본도 ACK (XPENDING 방지)
			try {
				failedMessagePusher.pushToDlq(record, ex);
				log.info("실패한 메시지를 DLQ로 이동 완료 - messageId: {}", record.getId().getValue());
			} catch (Exception dlqEx) {
				log.error("DLQ 저장 실패 - messageId: {}", record.getId().getValue());
			} finally {
				safeAck(record);
			}
		}
	}

	private String buildDefaultName(String username) {
		if (username == null || username.isBlank()) return "기본 플레이리스트";
		return username + "의 기본 플레이리스트";
	}

	private void ack(MapRecord<String, String, String> record) {
		redisTemplate.opsForStream().acknowledge(
			UserEventPublisher.STREAM_KEY, GROUP, record.getId());
	}

	private void safeAck(MapRecord<String, String, String> record) {
		try {
			ack(record);
		} catch (DataAccessException e) {
			log.error("ACK 실패 - id={}", record.getId().getValue(), e);
		}
	}
}
