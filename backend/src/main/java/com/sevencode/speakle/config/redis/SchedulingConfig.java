package com.sevencode.speakle.config.redis;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulingConfig {
	// 스케줄링을 위한 설정 클래스
	// @Scheduled 어노테이션이 동작하도록 함
}
