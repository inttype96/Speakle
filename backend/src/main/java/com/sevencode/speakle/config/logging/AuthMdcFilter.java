/*
 * 사용자 식별필터-작성자:kang
 * JWT 뒷단에서 식별
 */
package com.sevencode.speakle.config.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.MDC;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.sevencode.speakle.config.security.UserPrincipal;

import java.io.IOException;

@Component
public class AuthMdcFilter extends OncePerRequestFilter {

	private static final String MDC_LOGIN_ID = "loginId";
	private static final String MDC_LOGIN_NAME = "loginName";

	@Override
	protected void doFilterInternal(HttpServletRequest request,
		HttpServletResponse response,
		FilterChain chain)
		throws ServletException, IOException {

		try {
			Authentication auth = SecurityContextHolder.getContext().getAuthentication();

			if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {

				if (auth.getPrincipal() instanceof UserPrincipal p) {
					MDC.put(MDC_LOGIN_ID, String.valueOf(p.userId()));
					MDC.put(MDC_LOGIN_NAME, p.username());
				} else {
					MDC.put(MDC_LOGIN_ID, auth.getName());
					MDC.put(MDC_LOGIN_NAME, auth.getName());
				}
			}

			chain.doFilter(request, response);

		} finally {
			MDC.remove(MDC_LOGIN_ID);
			MDC.remove(MDC_LOGIN_NAME);
		}
	}
}