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

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtProvider jwtProvider;

	public JwtAuthenticationFilter(JwtProvider jwtProvider) {
		this.jwtProvider = jwtProvider;
	}

	@Override
	protected void doFilterInternal(@NonNull HttpServletRequest request,
		@NonNull HttpServletResponse response,
		@NonNull FilterChain filterChain)
		throws ServletException, IOException {

		String token = resolveBearerToken(request);

		if (token != null) {
			try {
				if (jwtProvider.isValid(token)) {
					Long userId = jwtProvider.extractUserId(token);
					String username = jwtProvider.extractUsername(token);

					var principal = new UserPrincipal(userId, username);
					var auth = new UsernamePasswordAuthenticationToken(principal, null, List.of());
					SecurityContextHolder.getContext().setAuthentication(auth);
				}
			} catch (ExpiredJwtException ex) {
				if (jwtProvider.isRefreshToken(token)) {
					request.setAttribute("auth_error", "REFRESH_EXPIRED");
				} else {
					request.setAttribute("auth_error", "ACCESS_EXPIRED");
				}
			} catch (JwtException | IllegalArgumentException ex) {
				request.setAttribute("auth_error", "INVALID_TOKEN");
			}
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