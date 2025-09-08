/**
 * jwt 에러 엔트리-작성자:kang
 */
package com.sevencode.speakle.config.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import java.io.IOException;
import java.util.Map;

public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

	private final ObjectMapper objectMapper = new ObjectMapper(); // 공용 ObjectMapper 주입해도 됨

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response,
		AuthenticationException authException)
		throws IOException, ServletException {

		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);

		String cause = (String)request.getAttribute("auth_error");

		String code;
		String message;

		if ("ACCESS_EXPIRED".equals(cause)) {
			code = "ACCESS_TOKEN_EXPIRED";
			message = "Access token expired. Please use refresh token to obtain a new access token.";
		} else if ("REFRESH_EXPIRED".equals(cause)) {
			code = "REFRESH_TOKEN_EXPIRED";
			message = "Refresh token expired. Please login again.";
		} else if ("INVALID_TOKEN".equals(cause)) {
			code = "INVALID_TOKEN";
			message = "Invalid or malformed JWT token.";
		} else {
			code = "AUTH_UNAUTHORIZED";
			message = "Authentication required.";
		}

		var body = Map.of(
			"code", code,
			"message", message,
			"path", request.getRequestURI()
		);

		objectMapper.writeValue(response.getOutputStream(), body);
	}
}
