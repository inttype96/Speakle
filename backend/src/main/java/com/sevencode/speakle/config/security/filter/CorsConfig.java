// /*
//  * cors 설정-작성자:kang
//  * 여기도 securityconfig에서 설정 가능하나
//  * 실별을 위해 따로 설정
//  */
// package com.sevencode.speakle.config.security.filter;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.web.cors.CorsConfiguration;
// import org.springframework.web.cors.CorsConfigurationSource;
// import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
// import org.springframework.beans.factory.annotation.Value;

// import java.util.List;

// @Configuration
// public class CorsConfig {

// 	@Value("${spring.profiles.active:local}")
// 	private String profile;

// 	@Bean
// 	public CorsConfigurationSource corsConfigurationSource() {
// 		/* CORS 정책 정의 및 Bean 등록 */
// 		CorsConfiguration config = new CorsConfiguration();

// 		switch (profile) {
// 			case "local" -> setLocal(config);
// 			case "dev" -> setDev(config);
// 			case "prod" -> setProd(config);
// 		}
// 		config.setAllowCredentials(true);
// 		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
// 		source.registerCorsConfiguration("/**", config);
// 		return source;
// 	}

// 	/** Local 환경 - 개발 편의용 */
// 	private void setLocal(CorsConfiguration config) {
// 		config.setAllowedOriginPatterns(List.of("*"));
// 		config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
// 		config.setAllowedHeaders(List.of("*"));

// 	}

// 	/** Dev 환경 - 개발 서버 전용 Origin */
// 	private void setDev(CorsConfiguration config) {
// 		config.setAllowedOriginPatterns(List.of("*"));
// 		config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
// 		config.setAllowedHeaders(List.of("*"));

// 	}

// 	/** Prod 환경 - 운영 배포 전용 Origin */
// 	private void setProd(CorsConfiguration config) {
// 		config.setAllowedOrigins(List.of(
// 			"https://www.myfrontend.com",
// 			"https://admin.myfrontend.com"
// 		));
// 		config.setAllowedMethods(List.of("GET", "POST", "DELETE", "PATCH"));
// 		config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
// 	}
// }


