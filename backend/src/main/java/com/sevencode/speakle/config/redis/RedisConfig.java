package com.sevencode.speakle.config.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

	@Bean(name = "redisObjectMapper")
	public ObjectMapper redisObjectMapper() {
		ObjectMapper om = new ObjectMapper();
		om.registerModule(new JavaTimeModule());
		om.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
		om.findAndRegisterModules();
		return om;
	}

	@Bean(name = "redisTemplate")
	@SuppressWarnings({"unchecked", "rawtypes"})
	public RedisTemplate redisTemplate(
		RedisConnectionFactory connectionFactory,
		@Qualifier("redisObjectMapper") ObjectMapper redisObjectMapper
	) {
		RedisTemplate template = new RedisTemplate<>();
		template.setConnectionFactory(connectionFactory);

		// String 직렬화
		StringRedisSerializer stringSerializer = new StringRedisSerializer();

		// JSON 직렬화 - Redis 전용 ObjectMapper 사용
		GenericJackson2JsonRedisSerializer jsonSerializer =
			new GenericJackson2JsonRedisSerializer(redisObjectMapper);

		// Key 직렬화 설정
		template.setKeySerializer(stringSerializer);
		template.setHashKeySerializer(stringSerializer);

		// Value 직렬화 설정
		template.setValueSerializer(jsonSerializer);
		template.setHashValueSerializer(jsonSerializer);

		// 기본 직렬화 설정 (fallback)
		template.setDefaultSerializer(jsonSerializer);

		template.afterPropertiesSet();
		return template;
	}

	@Bean(name = "stringRedisTemplate")
	public org.springframework.data.redis.core.StringRedisTemplate stringRedisTemplate(
		RedisConnectionFactory connectionFactory
	) {
		return new org.springframework.data.redis.core.StringRedisTemplate(connectionFactory);
	}
}
