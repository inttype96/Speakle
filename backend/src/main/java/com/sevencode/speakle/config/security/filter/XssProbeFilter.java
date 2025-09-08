/*
 * XssProbeFilter - 작성자:kang
 * 요청 파라미터 값에 대해 단순 XSS 패턴(<script, javascript:, onerror, onload) 탐지 후 로그 경고.
 * JSON/Multipart 바디는 검사하지 않으며, 운영 환경에서는 allowlist 기반 검증과 병행 필요.
 */
package com.sevencode.speakle.config.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Enumeration;

public class XssProbeFilter extends OncePerRequestFilter {
	private static final Logger log = LoggerFactory.getLogger(XssProbeFilter.class);

	@Override
	protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
		throws ServletException, IOException {

		// 파라미터만 검사(바디/Part는 비변조 원칙 유지). JSON 바디 검사 필요 시 별도 Reader 래핑 로직을 분리 구현할 것.
		Enumeration<String> names = req.getParameterNames();
		while (names.hasMoreElements()) {
			String name = names.nextElement();
			String[] values = req.getParameterValues(name);
			if (values == null)
				continue;

			for (String v : values) {
				if (v != null && looksLikeScript(v)) {
					// 경고 로그(미스/히트는 운영에서 튜닝). 미적용 구간에서 과한 로그는 노이즈가 될 수 있음.
					log.warn("XSS-like input detected param={} valuePreview={}", name, preview(v));
				}
			}
		}

		chain.doFilter(req, res);
	}

	// 최소한의 휴리스틱(단순 패턴). 실서비스는 allowlist 기반 정화/검증을 병행할 것.
	private boolean looksLikeScript(String v) {
		String s = v.toLowerCase();
		return s.contains("<script")
			|| s.contains("javascript:")
			|| s.contains("onerror=")
			|| s.contains("onload=");
	}

	private String preview(String v) {
		return v.length() > 120 ? v.substring(0, 120) + "..." : v;
	}
}
