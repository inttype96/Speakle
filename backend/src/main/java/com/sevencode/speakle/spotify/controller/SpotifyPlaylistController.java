package com.sevencode.speakle.spotify.controller;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.spotify.dto.request.AddTracksToPlaylistRequest;
import com.sevencode.speakle.spotify.dto.request.CreatePlaylistRequest;
import com.sevencode.speakle.spotify.dto.request.RemoveTracksFromPlaylistRequest;
import com.sevencode.speakle.spotify.dto.response.SpotifyErrorResponse;
import com.sevencode.speakle.spotify.dto.response.SpotifyPlaylistResponse;
import com.sevencode.speakle.spotify.entity.SpotifyAccount;
import com.sevencode.speakle.spotify.repository.SpotifyAccountRepository;
import com.sevencode.speakle.spotify.service.SpotifyPlaylistService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/spotify/playlists")
@RequiredArgsConstructor
@Tag(name = "SpotifyPlaylist", description = "스포티파이 플레이리스트 관련 API")
public class SpotifyPlaylistController {

	private final SpotifyPlaylistService spotifyPlaylistService;
	private final SpotifyAccountRepository spotifyAccountRepository;

	@GetMapping("/debug/token-scope")
	public ResponseEntity<Map<String, Object>> getTokenScope(@AuthenticationPrincipal UserPrincipal auth) {
		SpotifyAccount account = spotifyAccountRepository.findByUserId(auth.userId()).orElse(null);
		Map<String, Object> result = new HashMap<>();

		if (account != null) {
			result.put("fullScope", account.getScope());

			if (account.getScope() != null) {
				String[] scopes = account.getScope().split(" ");
				result.put("totalScopes", scopes.length);
				result.put("allScopes", Arrays.asList(scopes));

				// 플레이리스트 관련 권한 체크
				result.put("playlist-read-private", Arrays.asList(scopes).contains("playlist-read-private"));
				result.put("playlist-read-collaborative", Arrays.asList(scopes).contains("playlist-read-collaborative"));
				result.put("playlist-modify-public", Arrays.asList(scopes).contains("playlist-modify-public"));
				result.put("playlist-modify-private", Arrays.asList(scopes).contains("playlist-modify-private"));
			}
		} else {
			result.put("error", "Spotify 계정이 연결되지 않음");
		}

		return ResponseEntity.ok(result);
	}

	// 플레이 리스트 생성
	@Operation(
		summary = "플레이리스트 생성",
		description = "사용자의 Spotify 계정에 새로운 플레이리스트를 생성합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "201", description = "플레이리스트 생성 성공",
			content = @Content(schema = @Schema(implementation = SpotifyPlaylistResponse.class))),
		@ApiResponse(responseCode = "400", description = "잘못된 요청 데이터",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class))),
		@ApiResponse(responseCode = "401", description = "Spotify 인증 만료",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class))),
		@ApiResponse(responseCode = "404", description = "Spotify 계정 연결되지 않음",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class)))
	})
	@PostMapping("/create")
	public ResponseEntity<SpotifyPlaylistResponse> createPlaylist(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Valid @RequestBody CreatePlaylistRequest request) {

		SpotifyPlaylistResponse playlist = spotifyPlaylistService.createPlaylist(auth, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(playlist);
	}
	// 플레이리스트 상세 정보 조회
	@Operation(
		summary = "플레이리스트 상세 조회",
		description = "특정 플레이리스트의 상세 정보를 조회합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "플레이리스트 조회 성공"),
		@ApiResponse(responseCode = "404", description = "플레이리스트를 찾을 수 없음",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class))),
		@ApiResponse(responseCode = "401", description = "Spotify 인증 만료",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class)))
	})
	@GetMapping("/{playlistId}")
	public ResponseEntity<Object> getPlaylist(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Parameter(description = "플레이리스트 ID", required = true)
		@PathVariable String playlistId) {

		return ResponseEntity.ok(spotifyPlaylistService.getPlaylist(auth, playlistId));
	}

	// 플레이리스트 상셍 정보 수정
	@Operation(
		summary = "플레이리스트 수정",
		description = "플레이리스트의 이름, 설명, 공개 설정을 수정합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "플레이리스트 수정 성공"),
		@ApiResponse(responseCode = "403", description = "플레이리스트 수정 권한 없음",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class))),
		@ApiResponse(responseCode = "404", description = "플레이리스트를 찾을 수 없음",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class)))
	})
	@PatchMapping("/{playlistId}")
	public ResponseEntity<Void> updatePlaylist(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Parameter(description = "플레이리스트 ID", required = true)
		@PathVariable String playlistId,
		@Valid @RequestBody CreatePlaylistRequest request) {

		spotifyPlaylistService.updatePlaylist(auth, playlistId, request);
		return ResponseEntity.ok().build();
	}

	// 플레이리스트 삭제
	@Operation(
		summary = "플레이리스트 삭제",
		description = "플레이리스트를 언팔로우합니다. (완전 삭제는 Spotify 웹/앱에서만 가능)"
	)
	@ApiResponses({
		@ApiResponse(responseCode = "204", description = "플레이리스트 삭제 성공"),
		@ApiResponse(responseCode = "403", description = "플레이리스트 삭제 권한 없음",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class))),
		@ApiResponse(responseCode = "404", description = "플레이리스트를 찾을 수 없음",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class)))
	})
	@DeleteMapping("/{playlistId}")
	public ResponseEntity<Void> deletePlaylist(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Parameter(description = "플레이리스트 ID", required = true)
		@PathVariable String playlistId) {

		spotifyPlaylistService.deletePlaylist(auth, playlistId);
		return ResponseEntity.noContent().build();
	}

	// 특정 플레이리스트 노래 목록 조회
	@Operation(
		summary = "플레이리스트 트랙 목록 조회",
		description = "특정 플레이리스트에 포함된 트랙 목록을 조회합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "트랙 목록 조회 성공"),
		@ApiResponse(responseCode = "404", description = "플레이리스트를 찾을 수 없음",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class)))
	})
	@GetMapping("/{playlistId}/tracks")
	public ResponseEntity<Object> getPlaylistTracks(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Parameter(description = "플레이리스트 ID", required = true)
		@PathVariable String playlistId,
		@Parameter(description = "가져올 트랙 수 (기본값: 20, 최대: 50)")
		@RequestParam(defaultValue = "20") Integer limit,
		@Parameter(description = "건너뛸 트랙 수 (페이징용, 기본값: 0)")
		@RequestParam(defaultValue = "0") Integer offset) {

		return ResponseEntity.ok(spotifyPlaylistService.getPlaylistTracks(auth, playlistId, limit, offset));
	}
	// 플레이리스트에 노래 추가
	@Operation(
		summary = "플레이리스트에 트랙 추가",
		description = "플레이리스트에 하나 이상의 트랙을 추가합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "201", description = "트랙 추가 성공"),
		@ApiResponse(responseCode = "400", description = "잘못된 요청 데이터",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class))),
		@ApiResponse(responseCode = "403", description = "플레이리스트 수정 권한 없음",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class))),
		@ApiResponse(responseCode = "404", description = "플레이리스트를 찾을 수 없음",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class)))
	})
	@PostMapping("/{playlistId}/tracks")
	public ResponseEntity<Object> addTracksToPlaylist(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Parameter(description = "플레이리스트 ID", required = true)
		@PathVariable String playlistId,
		@Valid @RequestBody AddTracksToPlaylistRequest request) {

		Object result = spotifyPlaylistService.addTracksToPlaylist(auth, playlistId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(result);
	}
	// 플레이리스트에서 노래 삭제
	@Operation(
		summary = "플레이리스트에서 트랙 삭제",
		description = "플레이리스트에서 하나 이상의 트랙을 삭제합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "트랙 삭제 성공"),
		@ApiResponse(responseCode = "400", description = "잘못된 요청 데이터",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class))),
		@ApiResponse(responseCode = "403", description = "플레이리스트 수정 권한 없음",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class))),
		@ApiResponse(responseCode = "404", description = "플레이리스트를 찾을 수 없음",
			content = @Content(schema = @Schema(implementation = SpotifyErrorResponse.class)))
	})
	@DeleteMapping("/{playlistId}/tracks")
	public ResponseEntity<Object> removeTracksFromPlaylist(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Parameter(description = "플레이리스트 ID", required = true)
		@PathVariable String playlistId,
		@Valid @RequestBody RemoveTracksFromPlaylistRequest request) {

		Object result = spotifyPlaylistService.removeTracksFromPlaylist(auth, playlistId, request);
		return ResponseEntity.ok(result);
	}

}
