package com.sevencode.speakle.social.spotify.controller;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.config.security.provider.JwtProvider;
import com.sevencode.speakle.member.domain.Member;
import com.sevencode.speakle.social.spotify.config.SpotifyProperties;
import com.sevencode.speakle.social.spotify.dto.request.SpotifyConnectRequest;
import com.sevencode.speakle.social.spotify.dto.response.SpotifyAccountInfoResponse;
import com.sevencode.speakle.social.spotify.service.SpotifyOauthService;
import com.sevencode.speakle.social.spotify.service.SpotifyService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth/oauth/spotify")
public class SpotifyController {

	// (OAuth 플로우) 비로그인에서도 접근: entry/callback 담당
	private final SpotifyOauthService oauthService;

	// (연결/토큰 관리) 로그인 사용자만 접근: connect/info/delete/token 담당
	private final SpotifyService spotifyService;

	// (환경) 리다이렉트 목적지 등
	private final SpotifyProperties props;

	// (토큰 발급) 콜백 종료 시 앱용 Access JWT 발급
	private final JwtProvider jwtProvider;

	// ───────────────────── 로그인 사용자용 (인증 필요) ─────────────────────

	/**
	 * 계정 연결(Authorization Code 교환)
	 * - 무엇: FE가 준 code/redirectUri로 서버가 직접 토큰 교환→/v1/me→연결/저장
	 * - 왜: client_secret 보관·프로필 신뢰성 확보(서버↔Spotify 직접 통신)
	 * - 주의: @AuthenticationPrincipal 필수(내부 userId 소유권 보장)
	 */
	@PostMapping("/connect")
	public ResponseEntity<SpotifyAccountInfoResponse> connect(
		@AuthenticationPrincipal UserPrincipal me,
		@Valid @RequestBody SpotifyConnectRequest req
	) {
		return ResponseEntity.ok(spotifyService.connect(me.userId(), req));
	}

	/**
	 * 연결 정보 조회(민감정보 제외)
	 * - 무엇: 저장된 spotifyUserId/scope/expiresAt 반환
	 * - 왜: FE가 연결 상태를 표시/갱신 판단
	 * - 주의: access/refresh 토큰은 절대 노출 금지
	 */
	@GetMapping("/info")
	public ResponseEntity<SpotifyAccountInfoResponse> info(
		@AuthenticationPrincipal UserPrincipal me
	) {
		return ResponseEntity.ok(spotifyService.getInfo(me.userId()));
	}

	/**
	 * 연결 해제
	 * - 무엇: 토큰→소셜연결 순서 삭제(FK/제약 고려)
	 * - 왜: 사용자 요청 시 계정 연결 철회
	 */
	@DeleteMapping("/delete")
	public ResponseEntity<Void> disconnect(
		@AuthenticationPrincipal UserPrincipal me
	) {
		spotifyService.disconnect(me.userId());
		return ResponseEntity.noContent().build();
	}

	/**
	 * AccessToken 갱신
	 * - 무엇: 저장된 refresh_token으로 /api/token(grant_type=refresh_token)
	 * - 왜: 만료 임박/만료 후 재생 제어 등 위해
	 * - 주의: refresh_token 미존재 시 재연결 유도
	 */
	@PostMapping("/token")
	public ResponseEntity<SpotifyAccountInfoResponse> refreshToken(
		@AuthenticationPrincipal UserPrincipal me
	) {
		return ResponseEntity.ok(spotifyService.refreshAccessToken(me.userId()));
	}

	// ───────────────────── 비로그인 공개 엔드포인트 ─────────────────────

	/**
	 * 엔트리(로그인 전)
	 * - 무엇: state 발급 + Spotify /authorize URL 생성 후 302 리다이렉트
	 * - 왜: CSRF·계정 스와프 방지(state), FE가 직접 /authorize로 이동시키면 노출/변조 위험
	 * - 주의: 반드시 서버에서 URL 조합(클라 조합 금지)
	 */
	@GetMapping("/entry")
	public ResponseEntity<Void> entry() {
		String url = oauthService.entry();
		return ResponseEntity.status(302).header("Location", url).build();
	}

	/**
	 * 콜백(로그인 전)
	 * - 무엇: state 검증→code 교환→/v1/me→JIT 회원 생성/매칭→앱용 JWT 발급→리다이렉트
	 * - 왜: 프런트 전달값 불신, 서버↔Spotify 직접 통신으로 본인성 확인
	 * - 주의:
	 *   * state 미검증 금지(반드시 서버 저장본과 대조/소비)
	 *   * username이 VO일 수 있어 안전하게 문자열 추출(프로젝트 모델에 맞춤)
	 *   * postLoginRedirect로만 리다이렉트(오픈 리다이렉트 방지: 허용 리스트 사용 권장)
	 */
	@GetMapping("/callback")
	public ResponseEntity<?> callback(@RequestParam String code, @RequestParam String state) {
		// 1) 서버가 Spotify와 통신해 최종 Member 획득
		Member member = oauthService.callback(code, state);

		// 2) 앱용 Access JWT 발급 (서명 주체: 우리 서비스 사용자)
		String username = null;
		try {
			username = member.getUsername().getValue();
		} catch (Exception ignore) {
		}
		if (username == null || username.isBlank()) {
			try {
				username = member.getEmail().getValue();
			} catch (Exception ignore) {
			}
		}
		if (username == null)
			username = "user-" + member.getId(); // 최후 폴백

		String jwt = jwtProvider.createAccessToken(member.getId(), username);

		// 3) 최종 리다이렉트(또는 JSON)
		String redirect = UriComponentsBuilder.fromUriString(props.getPostLoginRedirect())
			.queryParam("jwt", jwt)
			.build(true).toUriString();
		return ResponseEntity.status(302).header("Location", redirect).build();

		// JSON을 원하면 위 대신:
		// return ResponseEntity.ok(Map.of("token", jwt, "userId", member.getId()));
	}
}
