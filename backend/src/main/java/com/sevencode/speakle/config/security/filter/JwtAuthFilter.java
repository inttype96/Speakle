package com.sevencode.speakle.config.security.filter;
// package com.speakle.sevencode.config.security.filter;

// import com.speakle.sevencode.config.security.provider.JwtProvider;
// import jakarta.servlet.FilterChain;
// import jakarta.servlet.ServletException;
// import jakarta.servlet.http.HttpServletRequest;
// import jakarta.servlet.http.HttpServletResponse;
// import lombok.RequiredArgsConstructor;
// import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
// import org.springframework.stereotype.Component;
// import org.springframework.web.filter.OncePerRequestFilter;

// import java.io.IOException;

// /**
//  * JWT 인증 필터
//  * - Authorization 헤더에서 토큰 추출
//  * - JwtProvider로 검증
//  * - 유효하면 SecurityContext에 인증 객체 저장
//  */
// @Component
// @RequiredArgsConstructor
// public class JwtAuthFilter extends OncePerRequestFilter {

//     private final JwtProvider jwtProvider;

//     @Override
//     protected void doFilterInternal(HttpServletRequest request,
//                                     HttpServletResponse response,
//                                     FilterChain filterChain) throws ServletException, IOException {

//         String token = jwtProvider.resolveToken(request);
//         if (token != null && jwtProvider.validateToken(token)) {
//             var auth = new UsernamePasswordAuthenticationToken(
//                 jwtProvider.getUserDetails(token),
//                 null,
//                 jwtProvider.getAuthorities(token)
//             );
//             auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
//             SecurityContextHolder.getContext().setAuthentication(auth);
//         }

//         filterChain.doFilter(request, response);
//     }
// }
