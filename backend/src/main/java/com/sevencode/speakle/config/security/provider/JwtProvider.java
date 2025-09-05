package com.sevencode.speakle.config.security.provider;
// package com.speakle.sevencode.config.security.provider;

// import jakarta.servlet.http.HttpServletRequest;
// import org.springframework.security.core.userdetails.User;
// import org.springframework.stereotype.Component;

// import java.util.Collections;

// /**
//  * JWT Provider
//  * - 토큰 생성, 검증, 사용자 정보 추출
//  */
// @Component
// public class JwtProvider {

//     public String resolveToken(HttpServletRequest request) {
//         String bearer = request.getHeader("Authorization");
//         if (bearer != null && bearer.startsWith("Bearer ")) {
//             return bearer.substring(7);
//         }
//         return null;
//     }

//     public boolean validateToken(String token) {
//         // TODO: JWT 검증 로직 추가
//         return true;
//     }

//     public Object getUserDetails(String token) {
//         // TODO: 토큰에서 사용자 정보 파싱
//         return new User("tempUser", "", Collections.emptyList());
//     }

//     public Object getAuthorities(String token) {
//         // TODO: 권한 추출
//         return Collections.emptyList();
//     }
// }
