package com.sevencode.speakle.config.security.handler;
// package com.speakle.sevencode.config.security.handler;

// import jakarta.servlet.http.HttpServletRequest;
// import jakarta.servlet.http.HttpServletResponse;
// import org.springframework.security.core.AuthenticationException;
// import org.springframework.security.web.AuthenticationEntryPoint;
// import org.springframework.stereotype.Component;

// import java.io.IOException;

// /**
//  * 인증 실패 핸들러
//  * - JWT 토큰이 없거나 유효하지 않을 때 401 반환
//  */
// @Component
// public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
//     @Override
//     public void commence(HttpServletRequest request,
//                          HttpServletResponse response,
//                          AuthenticationException authException) throws IOException {
//         response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
//     }
// }
