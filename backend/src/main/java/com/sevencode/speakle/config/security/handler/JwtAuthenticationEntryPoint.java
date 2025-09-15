package com.sevencode.speakle.config.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sevencode.speakle.common.dto.ResponseWrapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import java.io.IOException;

@Slf4j
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper(); // 필요 시 @Bean 주입으로 교체 가능

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        String cause = (String) request.getAttribute("auth_error");

        String message;
        if ("ACCESS_EXPIRED".equals(cause)) {
            message = "Access token expired. Please use refresh token to obtain a new access token.";
        } else if ("REFRESH_EXPIRED".equals(cause)) {
            message = "Refresh token expired. Please login again.";
        } else if ("INVALID_TOKEN".equals(cause)) {
            message = "Invalid or malformed JWT token.";
        } else {
            message = "Authentication required.";
        }

        // corrId 추적 로그
        String corrId = MDC.get("corrId");
        log.warn("JWT 인증 실패 cause={}, uri={}, corrId={}", cause, request.getRequestURI(), corrId);

        // 401 응답 + ResponseWrapper 통일
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(),
                ResponseWrapper.fail(HttpServletResponse.SC_UNAUTHORIZED, message)
        );
    }
}
