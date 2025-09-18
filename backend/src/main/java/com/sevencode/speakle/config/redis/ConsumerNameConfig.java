package com.sevencode.speakle.config.redis;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class ConsumerNameConfig {

	@Bean
	public String streamConsumerName(Environment env) {
		// 활성 프로필(없으면 spring.profiles.active, 그것도 없으면 default)
		String[] actives = env.getActiveProfiles();
		String profile = actives.length > 0
			? actives[0]
			: env.getProperty("spring.profiles.active", "local");

		// PID 또는 랜덤
		String pidPart;
		try {
			String name = java.lang.management.ManagementFactory.getRuntimeMXBean().getName(); // "12345@host"
			pidPart = (name != null && name.contains("@")) ? name.substring(0, name.indexOf('@')) : name;
			if (pidPart == null || pidPart.isBlank()) throw new IllegalStateException();
		} catch (Exception e) {
			pidPart = java.util.UUID.randomUUID().toString().substring(0, 8);
		}

		// 예: playlist-consumer-prod-12345
		return "playlist-consumer-" + profile + "-" + pidPart;
	}
}
