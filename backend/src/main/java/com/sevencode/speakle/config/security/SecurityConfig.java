package com.sevencode.speakle.config.security;

/**
 * SecurityConfig
 * -------------------------
 * 역할:
 *   - 환경별(Security Profile)에 따라 정책 분기
 *     - local : 모든 요청 허용
 *     - dev/prod : 보안 정책 적용 (Stateless, JWT 등)
 *   - Spring Security 전반 설정
 *   - 세션 미사용(Stateless)
 *   - 기본 인증/폼 로그인 비활성화
 *   - (TODO) JWT 필터 / 인증 진입점 / 접근 거부 핸들러 추가 예정
 *
 * 작성자: kang
 */

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

	// application.properties → spring.profiles.active 값
	@Value("${spring.profiles.active:local}")
	private String activeProfile;

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		if ("local".equals(activeProfile)) {
			// 로컬 개발환경 → 보안 무시, 모든 요청 허용
			http.csrf(csrf -> csrf.disable())
				.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
		} else {
			// dev / prod 환경 → 보안 정책 적용
			http
				.csrf(csrf -> csrf.disable())
				.httpBasic(b -> b.disable())
				.formLogin(f -> f.disable())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				// TODO [kang]: 인증 예외 핸들러 등록 (JwtAuthenticationEntryPoint)
				// .exceptionHandling(e -> e.authenticationEntryPoint(jwtEntryPoint))
				.authorizeHttpRequests(auth -> auth
					.requestMatchers("/api/v1/auth/**").permitAll()
					.anyRequest().authenticated()
				);
			// TODO [kang]: JWT 필터 추가
			// .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
			// TODO [kang]: 고위험 경로 전용 XSS 탐지 필터 적용 예정
			//   - 적용 대상: 댓글/게시글/프로필 입력 엔드포인트
			//   - 주의: 전역 등록 금지(노이즈/성능 이슈). 특정 RequestMatcher만.
			//   - 현 시점: 탐지만 수행, 차단은 컨트롤러/Validator에서 처리
			//
			//   var xssPaths = new OrRequestMatcher(
			//       new AntPathRequestMatcher("/api/v1/comments/**"),
			//       new AntPathRequestMatcher("/api/v1/posts/**"),
			//       new AntPathRequestMatcher("/api/v1/profile/**")
			//   );
			//   http.addFilterBefore(new XssProbeFilter(xssPaths),
			//       UsernamePasswordAuthenticationFilter.class);
		}

		return http.build();
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
		return config.getAuthenticationManager();
	}
}
