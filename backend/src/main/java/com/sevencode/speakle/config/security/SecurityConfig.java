/*주석 미작성-작성자:kang */
package com.sevencode.speakle.config.security;

import com.sevencode.speakle.config.security.filter.MockUserFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.sevencode.speakle.config.logging.AuthMdcFilter;
import com.sevencode.speakle.config.security.filter.JwtAuthenticationFilter;
import com.sevencode.speakle.config.security.handler.JwtAuthenticationEntryPoint;
import com.sevencode.speakle.config.security.provider.JwtProvider;

@Configuration
public class SecurityConfig {

	@Value("${spring.profiles.active}")
	private String activeProfile;

	@Autowired
	private AuthMdcFilter authMdcFilter;

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http, JwtProvider jwtProvider) throws Exception {
		if ("local".equals(activeProfile)) {
			// 로컬 개발환경 → Mock User 자동 주입 + 보안 무시, 모든 요청 허용
			http.csrf(csrf -> csrf.disable())
					.authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
					.addFilterBefore(new MockUserFilter(), UsernamePasswordAuthenticationFilter.class);
		} else {
			// dev / prod 환경 → 보안 정책 적용
			http
				.csrf(csrf -> csrf.disable())
				.httpBasic(b -> b.disable())
				.formLogin(f -> f.disable())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling(e -> e
						// 인증 실패(401) JSON 응답
						.authenticationEntryPoint(new JwtAuthenticationEntryPoint())
					// NOTE: 403 권한 분리 미구현으로 생략
				)
				.authorizeHttpRequests(auth -> auth
					// 정적 리소스만 공개 (필요 시 경로 조정)
					.requestMatchers("/static/**").permitAll()

					// ── 공개/인증 예외 경로
					.requestMatchers("/api/oauth/**").permitAll()
					.requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/refresh").permitAll()
					.requestMatchers(HttpMethod.POST, "/api/user").permitAll()
					.requestMatchers(HttpMethod.POST, "/api/user/temp-password").permitAll()
					.requestMatchers(HttpMethod.POST, "/api/user/verify", "/api/user/verify/send").permitAll()

					// 파일 다운로드는 공개 금지 
					.requestMatchers("/files/**").authenticated()

					// ── 보호 경로
					.requestMatchers("/user/**").authenticated()
					.requestMatchers("/api/learn/**").authenticated()			// ay

					// 그 외 필요 시 정책 추가
					.anyRequest().permitAll()
				);
			http.addFilterBefore(new JwtAuthenticationFilter(jwtProvider), UsernamePasswordAuthenticationFilter.class);
			http.addFilterAfter(authMdcFilter, JwtAuthenticationFilter.class);
			// (선택) 특정 고위험 경로에만 XSS 탐지 필터 적용하고 싶을 때 아래 주석 참고
			// var xssFilter = new XssProbeFilter(new OrRequestMatcher(
			//     new AntPathRequestMatcher("/user/profile-image", "POST"),
			//     new AntPathRequestMatcher("/user", "PATCH")
			// ));
			// http.addFilterBefore(xssFilter, UsernamePasswordAuthenticationFilter.class);
		}

		return http.build();
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
		return config.getAuthenticationManager();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
