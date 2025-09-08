/*
 * 상관 필터 설정-작성자:kang
 * securityconfig에서 설정해도 되나
 * 최초 설정시 따로 파일 생성
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
		reg.setOrder(Integer.MIN_VALUE);
		reg.addUrlPatterns("/*");         // 기본 전체. 필요 시 조정
		return reg;
	}
}
