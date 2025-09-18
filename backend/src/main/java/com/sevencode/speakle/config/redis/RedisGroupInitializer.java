package com.sevencode.speakle.config.redis;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.Map;

@Slf4j
@Configuration
public class RedisGroupInitializer {

	@Bean
	public ApplicationRunner createGroupIfAbsent(StringRedisTemplate redisTemplate) {
		return args -> {
			final String stream = com.sevencode.speakle.event.publisher.UserEventPublisher.STREAM_KEY;
			final String group  = RedisStreamsConfig.GROUP;
			try {
				// 스트림 없으면 더미로 생성
				if (!redisTemplate.hasKey(stream)) {
					redisTemplate.opsForStream().add(stream, Map.of("init", "dummy"));
					log.info("스트림 생성: {}", stream);
				}
				// 그룹 생성 시도 (ReadOffset.latest()로 새 메시지만 처리)
				redisTemplate.opsForStream().createGroup(stream, org.springframework.data.redis.connection.stream.ReadOffset.latest(), group);
				log.info("Consumer Group 생성: {}", group);
			} catch (Exception e) {
				String msg = e.getMessage();
				String causeMsg = e.getCause() != null ? e.getCause().getMessage() : "";

				// BUSYGROUP 에러는 정상적인 상황 (그룹이 이미 존재)
				if ((msg != null && msg.contains("BUSYGROUP")) ||
					(causeMsg != null && causeMsg.contains("BUSYGROUP"))) {
					log.info("Consumer Group이 이미 존재함: {}", group);
				} else {
					log.error("Consumer Group 생성 실패: {}, 상세 오류: {}", group, msg, e);
				}
			}
		};
	}
}
