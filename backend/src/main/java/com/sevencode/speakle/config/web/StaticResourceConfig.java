/** 주석 미작성-작성자:kang */
package com.sevencode.speakle.config.web;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		// 기본 정적 리소스 (classpath:/static/)
		registry.addResourceHandler("/static/**").addResourceLocations("classpath:/static/");

		// 외부 업로드 디렉토리 매핑
		registry.addResourceHandler("/files/**").addResourceLocations("file:./uploads/");
		// 절대경로 예시: "file:/opt/app/uploads/"
	}
}
