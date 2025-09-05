package com.sevencode.speakle.config.security.handler;
// package com.speakle.sevencode.config.security.handler;

// import jakarta.servlet.http.HttpServletRequest;
// import jakarta.servlet.http.HttpServletResponse;
// import org.springframework.security.access.AccessDeniedException;
// import org.springframework.security.web.access.AccessDeniedHandler;
// import org.springframework.stereotype.Component;

// import java.io.IOException;

// /**
//  * 인가 실패 핸들러
//  * - 권한 부족 시 403 반환
//  */
// @Component
// public class AccessDeniedHandlerImpl implements AccessDeniedHandler {
//     @Override
//     public void handle(HttpServletRequest request,
//                        HttpServletResponse response,
//                        AccessDeniedException accessDeniedException) throws IOException {
//         response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden");
//     }
// }
