package com.sevencode.speakle.playlist.controller;

import java.util.List;
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
import com.sevencode.speakle.playlist.dto.request.AddTracksToCustomPlaylistRequest;
import com.sevencode.speakle.playlist.dto.request.CreateCustomPlaylistRequest;
import com.sevencode.speakle.playlist.dto.request.RemoveTracksFromCustomPlaylistRequest;
import com.sevencode.speakle.playlist.dto.response.CustomPlaylistResponse;
import com.sevencode.speakle.playlist.dto.response.CustomPlaylistTracksResponse;
import com.sevencode.speakle.playlist.dto.response.DeletePlaylistResponse;
import com.sevencode.speakle.playlist.service.CustomPlaylistService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/playlists")
@RequiredArgsConstructor
@Tag(name = "Custom Playlist", description = "자체 플레이리스트 관리 API")
public class CustomPlaylistController {

	private final CustomPlaylistService customPlaylistService;

	@Operation(
		summary = "자체 플레이리스트 생성",
		description = "자체 플레이리스트를 생성합니다. Spotify API와 동일한 응답 형식을 제공합니다."
	)
	@ApiResponses({
		@ApiResponse(responseCode = "201", description = "플레이리스트 생성 성공"),
		@ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
		@ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
	})
	@PostMapping("/create")
	public ResponseEntity<CustomPlaylistResponse> createPlaylist(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Valid @RequestBody CreateCustomPlaylistRequest request) {

		CustomPlaylistResponse playlist = customPlaylistService.createPlaylist(auth, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(playlist);
	}

	@Operation(
		summary = "사용자 플레이리스트 목록 조회",
		description = "현재 사용자의 자체 플레이리스트 목록을 조회합니다."
	)
	@GetMapping("/my-playlists")
	public ResponseEntity<List<CustomPlaylistResponse>> getUserPlaylists(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth) {

		List<CustomPlaylistResponse> playlists = customPlaylistService.getUserPlaylists(auth);
		return ResponseEntity.ok(playlists);
	}

	@Operation(
		summary = "플레이리스트 상세 조회",
		description = "특정 플레이리스트의 상세 정보를 조회합니다."
	)
	@GetMapping("/{playlistId}")
	public ResponseEntity<CustomPlaylistResponse> getPlaylist(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Parameter(description = "플레이리스트 ID", required = true)
		@PathVariable Long playlistId) {

		CustomPlaylistResponse playlist = customPlaylistService.getPlaylist(auth, playlistId);
		return ResponseEntity.ok(playlist);
	}

	@Operation(
		summary = "플레이리스트 수정",
		description = "플레이리스트의 이름, 설명, 공개 설정을 수정합니다."
	)
	@PatchMapping("/{playlistId}")
	public ResponseEntity<Void> updatePlaylist(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Parameter(description = "플레이리스트 ID", required = true)
		@PathVariable Long playlistId,
		@Valid @RequestBody CreateCustomPlaylistRequest request) {

		customPlaylistService.updatePlaylist(auth, playlistId, request);
		return ResponseEntity.ok().build();
	}

	@Operation(
		summary = "플레이리스트 삭제",
		description = "플레이리스트를 삭제합니다."
	)
	@DeleteMapping("/{playlistId}")
	public ResponseEntity<DeletePlaylistResponse> deletePlaylist(
		@Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal auth,
		@Parameter(description = "플레이리스트 ID", required = true)
		@PathVariable Long playlistId) {
		customPlaylistService.deletePlaylist(auth, playlistId);
		return ResponseEntity.ok(DeletePlaylistResponse.success(playlistId));
	}

	@Operation(
		summary = "플레이리스트 트랙 목록 조회",
		description = "특정 플레이리스트에 포함된 트랙 목록을 조회합니다."
	)
	@GetMapping("/{playlistId}/tracks")
	public ResponseEntity<CustomPlaylistTracksResponse> getPlaylistTracks(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Parameter(description = "플레이리스트 ID", required = true)
		@PathVariable Long playlistId,
		@Parameter(description = "가져올 트랙 수 (기본값: 20, 최대: 50)")
		@RequestParam(defaultValue = "20") Integer limit,
		@Parameter(description = "건너뛸 트랙 수 (페이징용, 기본값: 0)")
		@RequestParam(defaultValue = "0") Integer offset,
		@Parameter(description = "정렬 기준 (addedAt, playCount)", example = "addedAt")
		@RequestParam(required = false) String sortBy,
		@Parameter(description = "정렬 순서 (asc, desc)", example = "asc")
		@RequestParam(required = false) String order) {

		CustomPlaylistTracksResponse tracks = customPlaylistService.getPlaylistTracks(auth, playlistId, limit, offset, sortBy, order);
		return ResponseEntity.ok(tracks);
	}

	@Operation(
		summary = "플레이리스트에 트랙 추가",
		description = "플레이리스트에 하나 이상의 트랙을 추가합니다."
	)
	@PostMapping("/{playlistId}/tracks")
	public ResponseEntity<Object> addTracksToPlaylist(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Parameter(description = "플레이리스트 ID", required = true)
		@PathVariable Long playlistId,
		@Valid @RequestBody AddTracksToCustomPlaylistRequest request) {

		Object result = customPlaylistService.addTracksToPlaylist(auth, playlistId, request);
		return ResponseEntity.status(HttpStatus.CREATED).body(result);
	}

	@Operation(
		summary = "플레이리스트에서 트랙 삭제",
		description = "플레이리스트에서 하나 이상의 트랙을 삭제합니다."
	)
	@DeleteMapping("/{playlistId}/tracks")
	public ResponseEntity<Object> removeTracksFromPlaylist(
		@AuthenticationPrincipal @Parameter(hidden = true) UserPrincipal auth,
		@Parameter(description = "플레이리스트 ID", required = true)
		@PathVariable Long playlistId,
		@Valid @RequestBody RemoveTracksFromCustomPlaylistRequest request) {

		Object result = customPlaylistService.removeTracksFromPlaylist(auth, playlistId, request);
		return ResponseEntity.ok(result);
	}


}
