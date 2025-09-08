package com.sevencode.speakle.auth.service;

import com.sevencode.speakle.auth.dto.LoginRequest;
import com.sevencode.speakle.auth.dto.RefreshRequest;
import com.sevencode.speakle.auth.dto.TokenResponse;

public interface AuthService {

	/** 이메일/비밀번호 기반 로그인 */
	TokenResponse login(LoginRequest req);

	/** Refresh 토큰 기반 Access 토큰 재발급 */
	TokenResponse refresh(RefreshRequest req);

	/** 단일 기기 로그아웃 */
	void logout(String refreshToken);

	/** 전체 기기 로그아웃*/
	void logoutAll(Long userId);
}
