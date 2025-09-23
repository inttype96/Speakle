/**
 * jwt 필터-작성자:kang
 */
package com.sevencode.speakle.config.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.config.security.provider.JwtProvider;
import com.sevencode.speakle.event.dto.UserLoginEvent;
import org.springframework.context.ApplicationEventPublisher;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;

@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtProvider jwtProvider;
	private final ApplicationEventPublisher eventPublisher;

	public JwtAuthenticationFilter(JwtProvider jwtProvider, ApplicationEventPublisher eventPublisher) {
		this.jwtProvider = jwtProvider;
		this.eventPublisher = eventPublisher;
	}

	@Override
	protected void doFilterInternal(@NonNull HttpServletRequest request,
		@NonNull HttpServletResponse response,
		@NonNull FilterChain filterChain)
		throws ServletException, IOException {

		String requestUri = request.getRequestURI();
		log.debug("JWT Filter - Request URI: {}", requestUri);

		String token = resolveBearerToken(request);
		log.debug("JWT Filter - Token: {}", token != null ? token.substring(0, Math.min(token.length(), 20)) + "..." : "null");

		if (token != null) {
			try {
				if (jwtProvider.isValid(token)) {
					Long userId = jwtProvider.extractUserId(token);
					String username = jwtProvider.extractUsername(token);
					log.debug("JWT Filter - Extracted userId: {}, username: {}", userId, username);

					var principal = new UserPrincipal(userId, username);
					var auth = new UsernamePasswordAuthenticationToken(principal, null, List.of());
					SecurityContextHolder.getContext().setAuthentication(auth);
					log.debug("JWT Filter - Authentication set successfully");

					// 사용자 로그인 이벤트 발행
					try {
						UserLoginEvent loginEvent = UserLoginEvent.fromJwtVerification(userId, username);
						eventPublisher.publishEvent(loginEvent);
						log.debug("JWT Filter - Published UserLoginEvent for user: {}", userId);
					} catch (Exception e) {
						log.error("JWT Filter - Failed to publish UserLoginEvent for user {}: {}", userId, e.getMessage());
					}
				} else {
					log.debug("JWT Filter - Token is invalid");
				}
			} catch (ExpiredJwtException ex) {
				log.debug("JWT Filter - Token expired: {}", ex.getMessage());
				if (jwtProvider.isRefreshToken(token)) {
					request.setAttribute("auth_error", "REFRESH_EXPIRED");
				} else {
					request.setAttribute("auth_error", "ACCESS_EXPIRED");
				}
			} catch (JwtException | IllegalArgumentException ex) {
				log.debug("JWT Filter - Token error: {}", ex.getMessage());
				request.setAttribute("auth_error", "INVALID_TOKEN");
			}
		} else {
			log.debug("JWT Filter - No token found");
		}

		filterChain.doFilter(request, response);
	}

	/** "Bearer <token>" 형식일 때만 유효 */
	private String resolveBearerToken(HttpServletRequest request) {
		String header = request.getHeader("Authorization");
		if (header == null || header.isBlank())
			return null;
		if (!header.startsWith("Bearer "))
			return null;
		return header.substring(7).trim();
	}
}