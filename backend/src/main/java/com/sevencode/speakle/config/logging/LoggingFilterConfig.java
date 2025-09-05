/**
 * 파일 역할: 로깅 관련 필터 등록/순서 관리
 * 특이사항:
 *  - CorrelationFilter를 체인 최우선(Integer.MIN_VALUE)에 배치
 * 변경 이력: 2025-09-04 JH 최초
 */
package com.sevencode.speakle.config.logging;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LoggingFilterConfig {

	@Bean
	public FilterRegistrationBean<CorrelationFilter> correlationFilter() {
		FilterRegistrationBean<CorrelationFilter> reg = new FilterRegistrationBean<>(new CorrelationFilter());
		reg.setOrder(Integer.MIN_VALUE);     // 최우선 실행
		reg.addUrlPatterns("/*");         // 기본 전체. 필요 시 조정
		return reg;
	}
}
