package com.sevencode.speakle.config.web;

/*
 * JSON 메시지 컨버터 보완 설정(WebMvcConfigurer).
 * 1) Spring Boot는 Jackson이 클래스패스에 있으면 기본 ObjectMapper 및
 *    MappingJackson2HttpMessageConverter를 자동 구성한다.
 *    또한 Jackson 모듈(bean)들을 자동 등록한다. [Ref.1, Ref.2]
 * 2) 애플리케이션 컨텍스트에 사용자가 ObjectMapper 또는
 *    Jackson2ObjectMapperBuilder를 직접 @Bean으로 정의하면
 *    Spring Boot의 ObjectMapper 자동 구성은 백오프(비활성화)된다
 * 3) 기작성 코드 member는 기본 설정값을 향유 하고 있었다.
 */

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
		for (HttpMessageConverter<?> converter : converters) {
			if (converter instanceof MappingJackson2HttpMessageConverter jacksonConverter) {
				ObjectMapper om = jacksonConverter.getObjectMapper();
				om.registerModule(new JavaTimeModule());
				om.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
			}
		}
	}
}