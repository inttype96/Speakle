package com.sevencode.speakle.config.redis;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;

import java.time.Duration;
import java.util.Map;

@Slf4j
@Configuration
public class RedisStreamsConfig {

	public static final String GROUP = "playlist-service-v3";

	@Bean
	public StreamMessageListenerContainer<String, MapRecord<String, String, String>> streamListenerContainer(
		RedisConnectionFactory connectionFactory
	) {
		var options = StreamMessageListenerContainer.StreamMessageListenerContainerOptions
			.<String, MapRecord<String, String, String>>builder()
			.pollTimeout(Duration.ofSeconds(2))
			.batchSize(10)
			.errorHandler(t -> log.error("Stream container error", t))
			.build();

		return StreamMessageListenerContainer.create(connectionFactory, options);
	}
}
