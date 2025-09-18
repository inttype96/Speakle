package com.sevencode.speakle.spotify.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.spotify.dto.response.SpotifyLinkStatusResponse;
import com.sevencode.speakle.spotify.dto.response.SpotifyMe;
import com.sevencode.speakle.spotify.service.SpotifyService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/spotify")
@RequiredArgsConstructor
@Tag(name="Spotify Integration", description="스포티파이 계정 연동 관리 API")
public class SpotifyController {

	private final SpotifyService spotifyService;

	@Value("${app.frontend.base-url}")
	private String frontendBaseUrl;

	@Operation(
		summary = "스포티파이 계정 연결",
		description = "사용자를 Spotify 권한 동의 화면으로 리다이렉트합니다. 사용자가 권한을 승인하면 callback 엔드포인트로 돌아옵니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "302", description = "Spotify 인증 페이지로 리다이렉트"),
		@ApiResponse(responseCode = "401", description = "인증되지 않은 사용자",
			content = @Content(schema = @Schema(implementation = String.class))),
		@ApiResponse(responseCode = "500", description = "서버 오류")
	})
	@GetMapping("/connect")
	public ResponseEntity<Map<String, String>> connect(@AuthenticationPrincipal UserPrincipal auth) {
		String redirectUrl = spotifyService.buildAuthorizeRedirect(auth);
		return ResponseEntity.ok(Map.of("redirectUrl", redirectUrl));
	}

	@Operation(
		summary = "OAuth 콜백 처리",
		description = "Spotify에서 인증 완료 후 호출되는 콜백 엔드포인트입니다. 인증 코드를 받아 액세스 토큰으로 교환합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "연결 성공",
			content = @Content(schema = @Schema(implementation = String.class),
			examples = @ExampleObject(value = "연결 완료"))),
		@ApiResponse(responseCode = "400", description = "잘못된 인증 코드 또는 상태값"),
		@ApiResponse(responseCode = "500", description = "Spotify API 오류")
	})
	@GetMapping("/callback")
	public ResponseEntity<String> callback(
		@Parameter(description = "Spotify에서 제공하는 인증 코드", required = true)
		@RequestParam String code,
		@Parameter(description = "CSRF 방지를 위한 상태값", required = true)
		@RequestParam String state,
		HttpServletResponse response) throws IOException {
		spotifyService.handleCallback(code, state);
		response.sendRedirect(frontendBaseUrl + "/mypage");
		return ResponseEntity.ok("연결 완료");
	}

	@Operation(
		summary = "스포티파이 연결 해제",
		description = "연결된 Spotify 계정을 해제하고 저장된 토큰을 삭제합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "204", description = "연결 해제 성공"),
		@ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
		@ApiResponse(responseCode = "404", description = "연결된 Spotify 계정이 없음")
	})
	@DeleteMapping("/disconnect")
	public ResponseEntity<Void> disconnect(@Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal auth) {
		spotifyService.disconnect(auth);
		return ResponseEntity.noContent().build();
	}

	@Operation(
		summary = "연결 상태 조회",
		description = "현재 사용자의 Spotify 계정 연결 상태와 토큰 만료 시간을 조회합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "상태 조회 성공",
			content = @Content(schema = @Schema(implementation = SpotifyLinkStatusResponse.class))),
		@ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
	})
	@GetMapping("/status")
	public ResponseEntity<SpotifyLinkStatusResponse> getStatus(@Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal auth) {
		return ResponseEntity.ok(spotifyService.getStatus(auth));
	}

	@Operation(
		summary = "현재 재생 정보 조회",
		description = "Spotify에서 현재 재생 중인 트랙의 상세 정보를 조회합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "재생 정보 조회 성공"),
		@ApiResponse(responseCode = "401", description = "Spotify 인증 만료"),
		@ApiResponse(responseCode = "404", description = "Spotify 계정 연결되지 않음"),
		@ApiResponse(responseCode = "204", description = "재생 중인 음악 없음")
	})
	@GetMapping("/player")
	public ResponseEntity<Object> getCurrentPlayback(@Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal auth) {
		return ResponseEntity.ok(spotifyService.getCurrentPlayback(auth));
	}

	@Operation(
		summary = "Spotify 사용자 프로필 조회",
		description = "연결된 Spotify 계정의 사용자 프로필 정보를 조회합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "프로필 조회 성공",
			content = @Content(schema = @Schema(implementation = SpotifyMe.class))),
		@ApiResponse(responseCode = "401", description = "Spotify 인증 만료"),
		@ApiResponse(responseCode = "404", description = "Spotify 계정 연결되지 않음")
	})
	@GetMapping("/profile")
	public ResponseEntity<Object> getUserProfile(@Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal auth) {
		return ResponseEntity.ok(spotifyService.getUserProfile(auth));
	}

	@Operation(summary="플레이리스트 목록", description="사용자 플레이리스트 목록 조회")
	@GetMapping("/playlists")
	public ResponseEntity<Object> getUserPlaylists(@AuthenticationPrincipal UserPrincipal auth) {
		return ResponseEntity.ok(spotifyService.getUserPlaylists(auth));
	}

	@Operation(summary="재생 일시정지", description="현재 재생중인 트랙 일시정지")
	@PostMapping("/player/pause")
	public ResponseEntity<Map<String, String>> pausePlayback(@AuthenticationPrincipal UserPrincipal auth) {
		spotifyService.pausePlayback(auth);
		//return ResponseEntity.ok().build();
		return ResponseEntity.ok(Map.of("message", "재생이 일시정지되었습니다."));
	}

	@Operation(summary="재생 재개", description="일시정지된 트랙 재생 재개")
	@PostMapping("/player/play")
	public ResponseEntity<Map<String, String>> resumePlayback(@AuthenticationPrincipal UserPrincipal auth) {
		spotifyService.resumePlayback(auth);
		return ResponseEntity.ok(Map.of("message", "재생이 재개되었습니다."));
	}

	@Operation(summary="다음 트랙", description="다음 트랙으로 건너뛰기")
	@PostMapping("/player/next")
	public ResponseEntity<Map<String, String>> skipToNext(@AuthenticationPrincipal UserPrincipal auth) {
		spotifyService.skipToNext(auth);
		return ResponseEntity.ok(Map.of("message", "다음 트랙으로 이동했습니다."));
	}

	@Operation(summary="이전 트랙", description="이전 트랙으로 건너뛰기")
	@PostMapping("/player/previous")
	public ResponseEntity<Map<String, String>> skipToPrevious(@AuthenticationPrincipal UserPrincipal auth) {
		spotifyService.skipToPrevious(auth);
		return ResponseEntity.ok(Map.of("message", "이전 트랙으로 이동했습니다."));
	}
}
