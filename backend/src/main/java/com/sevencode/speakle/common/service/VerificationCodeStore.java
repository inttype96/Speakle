package com.sevencode.speakle.common.service;

import java.time.Duration;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class VerificationCodeStore {
	private static final String PREFIX = "verify:email:";
	private final RedisTemplate<String, Object> redisTemplate;

	// application.yml에서 오버라이드 가능
	@Value("${member.verify.ttl-minutes:5}")
	private long ttlMinutes;

	public void save(String email, String code) {
		redisTemplate.opsForValue().set(PREFIX + email, code, Duration.ofMinutes(ttlMinutes));
	}

	public String get(String email) {
		Object v = redisTemplate.opsForValue().get(PREFIX + email);
		return (v instanceof String) ? (String)v : null;
	}

	public void remove(String email) {
		redisTemplate.delete(PREFIX + email);
	}
}