/**
 * 사용자 인증 엔드포인트-작성자:kang
 *
 * 주요 기능 
 * 로그인 -> access_token 발급, refresh_token 저장
 * 로그아웃 -> refresh_token revoke
 * 리프레시 -> refresh_token revoke + 재발급
 * revoke all 
 */
package com.sevencode.speakle.auth.controller;

import com.sevencode.speakle.auth.dto.LoginRequest;
import com.sevencode.speakle.auth.dto.LogoutRequest;
import com.sevencode.speakle.auth.dto.RefreshRequest;
import com.sevencode.speakle.auth.dto.TokenResponse;
import com.sevencode.speakle.auth.service.AuthService;
import com.sevencode.speakle.config.security.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("api//auth")
public class AuthController {

	private final AuthService authService;

	@PostMapping("/login")
	public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
		return ResponseEntity.ok(authService.login(req));
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest req) {
		authService.logout(req.refreshToken());
		return ResponseEntity.noContent().build(); // 204
	}

	@PostMapping("/refresh")
	public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest req) {
		return ResponseEntity.ok(authService.refresh(req));
	}

	@PostMapping("/logout-all")
	public ResponseEntity<Void> logoutAll(@AuthenticationPrincipal UserPrincipal me) {
		authService.logoutAll(me.userId());
		return ResponseEntity.noContent().build();
	}
}