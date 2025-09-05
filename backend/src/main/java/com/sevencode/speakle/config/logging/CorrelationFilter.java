/**
 * 파일 역할: 요청 상관 필드(MDC) 주입 필터 (corrId, clientIp, clientAgent, loginId, loginName)
 * 특이사항:
 *  - Proxy 환경(X-Forwarded-For) 고려: 첫 번째 IP 사용
 *  - 응답 헤더에도 X-Correlation-ID 반영(액세스로그/클라이언트와 일치)
 * 변경 이력: 2025-09-04 JH 최초
 */
package com.sevencode.speakle.config.logging;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.MDC;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

public class CorrelationFilter implements Filter {

	@Override
	public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
		throws IOException, ServletException {

		HttpServletRequest request = (HttpServletRequest)req;
		HttpServletResponse response = (HttpServletResponse)res;

		// 1) corrId: 헤더 우선, 없으면 생성
		final String corrId = Optional.ofNullable(request.getHeader("X-Correlation-ID"))
			.filter(s -> !s.isBlank())
			.orElse(UUID.randomUUID().toString());

		// 2) clientIp: XFF 첫 항목 → 없으면 remoteAddr
		final String xff = request.getHeader("X-Forwarded-For");
		final String clientIp = (xff != null && !xff.isBlank())
			? xff.split(",")[0].trim()
			: request.getRemoteAddr();

		// 3) clientAgent: UA 원문
		final String clientAgent = Optional.ofNullable(request.getHeader("User-Agent"))
			.orElse("UNKNOWN");

		// 4) 로그인 사용자 (환경에 맞게 principal 파싱)
		String loginId = "SYSTEM";
		String loginName = "시스템";

		/* TODO [kang]: 유저 모델 나오면 작성 */
		// Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		// if (auth != null && auth.isAuthenticated() && auth.getPrincipal() != null) {
		//     try {
		//         Object p = auth.getPrincipal();
		//         // TODO: 실제 Principal 타입으로 교체
		//         // loginId = ((CoreAuthAdmin)p).getId();
		//         // loginName = ((CoreAuthAdmin)p).getName();
		//     } catch (Exception ignore) { /* 익명/시스템일 수 있음 */ }
		// }

		// MDC 주입
		MDC.put("corrId", corrId);
		MDC.put("clientIp", clientIp);
		MDC.put("clientAgent", clientAgent);
		MDC.put("loginId", loginId);
		MDC.put("loginName", loginName);

		// 응답 헤더에도 반영(액세스 로그·클라이언트 추적 일치)
		response.setHeader("X-Correlation-ID", corrId);

		try {
			chain.doFilter(req, res);
		} finally {
			MDC.clear(); // 요청 종료 시 정리
		}
	}
}
