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
