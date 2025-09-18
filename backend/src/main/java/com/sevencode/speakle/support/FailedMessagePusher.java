package com.sevencode.speakle.support;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;

import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sevencode.speakle.event.publisher.UserEventPublisher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** 실패 메시지를 DLQ(List)로 밀어넣는 유틸 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FailedMessagePusher {

	private static final String DLQ_KEY = "dlq:events:user:registered";

	private final StringRedisTemplate stringRedisTemplate;
	private final ObjectMapper objectMapper;

	public void pushToDlq(MapRecord<String, String, String> record, Exception ex) {
		try {
			String payload = record.getValue().get("data");
			var info = FailedMessageInfo.builder()
				.streamKey(UserEventPublisher.STREAM_KEY)
				.group("playlist-service")
				.messageId(record.getId().getValue())
				.payload(payload)
				.error(ex.getMessage())
				.stackTrace(toStack(ex))
				.retryCount(0)
				.firstFailedAt(Instant.now())
				.lastFailedAt(Instant.now())
				.version(1)
				.build();

			String json = objectMapper.writeValueAsString(info);
			stringRedisTemplate.opsForList().leftPush(DLQ_KEY, json);

			log.warn("DLQ 저장 완료 - messageId={}, dlqKey={}", record.getId().getValue(), DLQ_KEY);
		} catch (Exception e) {
			log.error("DLQ 저장 실패 - id={}", record.getId().getValue(), e);
		}
	}

	private String toStack(Exception e) {
		var sw = new StringWriter();
		e.printStackTrace(new PrintWriter(sw));
		return sw.toString();
	}
}
