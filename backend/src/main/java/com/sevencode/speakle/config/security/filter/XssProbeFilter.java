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

/**
 * XssProbeFilter
 * ------------------------------------------------------
 * 역할:
 *   - 요청 파라미터에서 단순 XSS 의심 패턴을 "탐지"하여 경고 로그만 남김.
 *   - 입력을 변조/삭제/치환하지 않음(비파괴). → JSON 파싱·파일 업로드 깨짐 방지.
 *
 * 과거 코드와의 관계:
 *   - (구) CrossScriptingFilter, RequestWrapper, XssAndSqlHttpServletRequestWrapper, ModifiableHttpServletRequest
 *     는 전역적으로 파라미터/바디를 정규식으로 치환하여 오탐·데이터 손상 위험이 컸음.
 *   - 본 필터는 "관측(로깅)"에만 집중. 차단/정화는 컨트롤러/서비스 계층의 화이트리스트 기반 검증(예: Jsoup)으로 분리.
 *
 * 사용 지침:
 *   - 전역 등록 지양. 고위험 엔드포인트(리치 텍스트 입력, 코멘트/게시물 작성 등)에 한정적으로 적용.
 *   - 차단 정책이 필요하면: 본 필터는 탐지→로그만 수행하고, 실제 차단은 Security 레이어의 AccessDeniedHandler,
 *     Validator, 컨트롤러 단 DTO 검증 등에서 수행.
 *
 * 브랜치: feature/BE_security_filter
 * 변경 이력:
 *   - 2025-09-05 kang 최초 작성
 */
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
					// ⚠️ 경고 로그(미스/히트는 운영에서 튜닝). 미적용 구간에서 과한 로그는 노이즈가 될 수 있음.
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
