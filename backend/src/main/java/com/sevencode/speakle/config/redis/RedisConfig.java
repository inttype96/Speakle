package com.sevencode.speakle.config.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

	@Bean
	public ObjectMapper redisObjectMapper() {
		ObjectMapper om = new ObjectMapper();
		om.registerModule(new JavaTimeModule());
		om.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
		return om;
	}

	@Bean
	public RedisTemplate<String, Object> redisTemplate(
		RedisConnectionFactory cf,
		ObjectMapper redisObjectMapper
	) {
		RedisTemplate<String, Object> tpl = new RedisTemplate<>();
		tpl.setConnectionFactory(cf);

		var keySer = new StringRedisSerializer();
		var valSer = new GenericJackson2JsonRedisSerializer(redisObjectMapper);

		tpl.setKeySerializer(keySer);
		tpl.setHashKeySerializer(keySer);
		tpl.setValueSerializer(valSer);
		tpl.setHashValueSerializer(valSer);
		tpl.afterPropertiesSet();
		return tpl;
	}

	@Bean
	public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory cf) {
		return new StringRedisTemplate(cf);
	}
}
