package com.sevencode.speakle.config.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

public class CorrelationFilter extends OncePerRequestFilter {

	// 헤더명 상수
	private static final String HDR_CORRELATION_ID = "X-Correlation-ID";
	private static final String HDR_CORRELATION_ID_ALT = "X-Correlation-Id";
	private static final String HDR_FORWARDED = "Forwarded";
	private static final String HDR_XFF = "X-Forwarded-For";
	private static final String HDR_X_REAL_IP = "X-Real-IP";
	private static final String HDR_USER_AGENT = "User-Agent";

	// MDC 키 상수
	private static final String MDC_CORR_ID = "corrId";
	private static final String MDC_CLIENT_IP = "clientIp";
	private static final String MDC_UA = "clientAgent";

	// 상관 ID 최대 길이(헤더 인젝션/오버헤드 방지)
	private static final int MAX_CORR_ID_LEN = 128;

	@Override
	protected void doFilterInternal(HttpServletRequest request,
		HttpServletResponse response,
		FilterChain chain)
		throws ServletException, IOException {

		final String corrId = resolveCorrelationId(request);
		final String clientIp = resolveClientIp(request);
		final String clientAgent = Optional.ofNullable(request.getHeader(HDR_USER_AGENT)).orElse("UNKNOWN");

		// MDC 주입
		MDC.put(MDC_CORR_ID, corrId);
		MDC.put(MDC_CLIENT_IP, clientIp);
		MDC.put(MDC_UA, clientAgent);

		// 응답 헤더에도 corrId 노출(클라/게이트웨이 추적 일치)
		response.setHeader(HDR_CORRELATION_ID, corrId);

		try {
			chain.doFilter(request, response);
		} finally {
			MDC.remove(MDC_CORR_ID);
			MDC.remove(MDC_CLIENT_IP);
			MDC.remove(MDC_UA);
		}
	}

	private String resolveCorrelationId(HttpServletRequest req) {
		String raw = firstNonBlank(
			req.getHeader(HDR_CORRELATION_ID),
			req.getHeader(HDR_CORRELATION_ID_ALT)
		);
		String normalized = normalizeCorrId(raw);
		return (normalized != null ? normalized : UUID.randomUUID().toString());
	}

	private String resolveClientIp(HttpServletRequest req) {
		String fwd = req.getHeader(HDR_FORWARDED);
		if (isNotBlank(fwd)) {
			// RFC 7239: for=1.2.3.4;proto=https;by=…
			String ip = parseForwardedFor(fwd);
			if (isNotBlank(ip))
				return ip;
		}
		String xff = req.getHeader(HDR_XFF);
		if (isNotBlank(xff)) {
			String first = xff.split(",")[0].trim();
			if (isNotBlank(first))
				return first;
		}
		String xReal = req.getHeader(HDR_X_REAL_IP);
		if (isNotBlank(xReal))
			return xReal.trim();

		return req.getRemoteAddr();
	}

	// ----- 내부 유틸 -----

	private static String firstNonBlank(String a, String b) {
		if (isNotBlank(a))
			return a;
		if (isNotBlank(b))
			return b;
		return null;
	}

	private static boolean isNotBlank(String s) {
		return s != null && !s.isBlank();
	}

	private static String normalizeCorrId(String raw) {
		if (!isNotBlank(raw))
			return null;
		String cleaned = raw.replace("\r", "").replace("\n", "").trim();
		if (cleaned.isEmpty())
			return null;
		if (cleaned.length() > MAX_CORR_ID_LEN) {
			cleaned = cleaned.substring(0, MAX_CORR_ID_LEN);
		}
		return cleaned;
	}

	private static String parseForwardedFor(String forwarded) {
		try {
			for (String part : forwarded.split(";")) {
				String[] kv = part.trim().split("=", 2);
				if (kv.length == 2 && "for".equalsIgnoreCase(kv[0].trim())) {
					String v = kv[1].trim();
					// 따옴표/대괄호 제거
					v = v.replaceAll("^[\\[\\\"]+|[\\]\\\"]+$", "");
					return v;
				}
			}
		} catch (Exception ignored) {
		}
		return null;
	}
}