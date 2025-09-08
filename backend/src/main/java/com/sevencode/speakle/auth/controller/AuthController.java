package com.sevencode.speakle.auth.controller;

import com.sevencode.speakle.auth.dto.LoginRequest;
import com.sevencode.speakle.auth.dto.RefreshRequest;
import com.sevencode.speakle.auth.dto.TokenResponse;
import com.sevencode.speakle.auth.service.AuthService;
// import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

	private final AuthService authService;

	// @Operation(summary = "로그인", description = "이메일/비밀번호로 로그인하고 JWT를 발급합니다.")
	@PostMapping("/login")
	public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
		return ResponseEntity.ok(authService.login(req));
	}

	/** refreshToken 1개 폐기(현재 기기에서만 로그아웃) */
	public record LogoutRequest(@NotBlank String refreshToken) {
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest req) {
		authService.logout(req.refreshToken());
		return ResponseEntity.noContent().build(); // 204
	}

	// @Operation(summary = "토큰 재발급", description = "Refresh 토큰으로 Access/Refresh 토큰을 재발급합니다.")
	@PostMapping("/refresh")
	public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest req) {
		return ResponseEntity.ok(authService.refresh(req));
	}

    /* 선택) 모든 기기에서 로그아웃 하고 싶을 때
       - Security에서 @AuthenticationPrincipal 로 본인 userId를 받아서 처리하세요.
       - AuthService에 logoutAll(userId) 추가 필요.
    */
	//    @PostMapping("/logout-all")
	//    public ResponseEntity<Void> logoutAll(@AuthenticationPrincipal UserPrincipal me) {
	//        authService.logoutAll(me.userId());
	//        return ResponseEntity.noContent().build();
	//    }
}