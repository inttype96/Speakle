package com.sevencode.speakle.spotify.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.spotify.dto.request.AddTracksToPlaylistRequest;
import com.sevencode.speakle.spotify.dto.request.CreatePlaylistRequest;
import com.sevencode.speakle.spotify.dto.request.RemoveTracksFromPlaylistRequest;
import com.sevencode.speakle.spotify.dto.response.SpotifyMe;
import com.sevencode.speakle.spotify.dto.response.SpotifyPlaylistResponse;
import com.sevencode.speakle.spotify.exception.SpotifyApiException;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SpotifyPlaylistService {

	@Qualifier("spotifyApiWebClient")
	@Autowired
	private WebClient apiWebClient;

	@Autowired
	private SpotifyTokenService spotifyTokenService;

	/**
	 * 플레이리스트 생성
	 */
	@Transactional
	public SpotifyPlaylistResponse createPlaylist(UserPrincipal auth, CreatePlaylistRequest request) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

		// 플레이리스트 생성 요청 바디 구성
		Map<String, Object> requestBody = createPlaylistRequestBody(request);

		log.info("플레이리스트 생성 요청 - userId: {}, requestBody: {}", auth.userId(), requestBody);

		try {
			// 방법 1: /v1/me/playlists 사용 (권장 - user_id가 필요 없음)
			log.info("방법 1 시도: /v1/me/playlists 사용");

			SpotifyPlaylistResponse result = apiWebClient.post()
				.uri("/v1/me/playlists")  // user_id 파라미터 없이 사용
				.headers(h -> h.setBearerAuth(accessToken))
				.contentType(MediaType.APPLICATION_JSON)
				.bodyValue(requestBody)
				.retrieve()
				.bodyToMono(SpotifyPlaylistResponse.class)
				.block();

			log.info("✅ 플레이리스트 생성 성공: {}", result != null ? result.getId() : "null");
			return result;

		} catch (WebClientResponseException e) {
			log.error("❌ 방법 1 실패: HTTP {} - {}", e.getStatusCode().value(), e.getResponseBodyAsString());

			// 방법 2: 사용자 정보 조회 후 /v1/users/{user_id}/playlists 사용
			try {
				log.info("방법 2 시도: 사용자 정보 조회 후 생성");

				// 사용자 정보 조회
				SpotifyMe userProfile = getUserProfile(accessToken);
				if (userProfile == null) {
					log.error("❌ 사용자 프로필 조회 실패: null 반환");
					throw new SpotifyApiException("사용자 정보를 가져올 수 없습니다.", 500);
				}

				if (userProfile.getId() == null || userProfile.getId().trim().isEmpty()) {
					log.error("❌ 사용자 ID가 비어있음: {}", userProfile);
					throw new SpotifyApiException("사용자 ID가 비어있습니다.", 500);
				}

				log.info("사용자 정보 조회 성공 - Spotify ID: {}, 이름: {}",
					userProfile.getId(), userProfile.getDisplayName());

				SpotifyPlaylistResponse result = apiWebClient.post()
					.uri("/v1/users/{user_id}/playlists", userProfile.getId())
					.headers(h -> h.setBearerAuth(accessToken))
					.contentType(MediaType.APPLICATION_JSON)
					.bodyValue(requestBody)
					.retrieve()
					.bodyToMono(SpotifyPlaylistResponse.class)
					.block();

				log.info("✅ 플레이리스트 생성 성공 (방법 2): {}", result != null ? result.getId() : "null");
				return result;

			} catch (WebClientResponseException e2) {
				log.error("❌ 방법 2도 실패: HTTP {} - {}", e2.getStatusCode().value(), e2.getResponseBodyAsString());
				throw new SpotifyApiException("플레이리스트 생성", e2.getStatusCode().value());
			} catch (Exception e2) {
				log.error("❌ 방법 2 처리 중 예외: {}", e2.getMessage(), e2);
				throw new SpotifyApiException("플레이리스트 생성 중 오류가 발생했습니다.", 500, e2);
			}

		} catch (Exception e) {
			log.error("❌ 플레이리스트 생성 중 예상치 못한 오류: {}", e.getMessage(), e);
			throw new SpotifyApiException("플레이리스트 생성 중 오류가 발생했습니다.", 500, e);
		}
	}

	/**
	 * 특정 플레이리스트 조회
	 */
	public Object getPlaylist(UserPrincipal auth, String playlistId) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

		try {
			return apiWebClient.get()
				.uri("/v1/playlists/{playlist_id}", playlistId)
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.bodyToMono(Object.class)
				.block();
		} catch (WebClientResponseException e) {
			log.error("플레이리스트 조회 실패: HTTP {} - {}", e.getStatusCode().value(), e.getResponseBodyAsString());
			throw new SpotifyApiException("플레이리스트 조회", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("플레이리스트 조회 실패: {}", e.getMessage(), e);
			throw new SpotifyApiException("플레이리스트 조회 중 오류가 발생했습니다.", 500, e);
		}
	}

	/**
	 * 플레이리스트 정보 수정
	 */
	public void updatePlaylist(UserPrincipal auth, String playlistId, CreatePlaylistRequest request) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

		// 수정할 데이터만 포함한 요청 바디 구성
		Map<String, Object> requestBody = createUpdateRequestBody(request);

		try {
			apiWebClient.put()
				.uri("/v1/playlists/{playlist_id}", playlistId)
				.headers(h -> h.setBearerAuth(accessToken))
				.contentType(MediaType.APPLICATION_JSON)
				.bodyValue(requestBody)
				.retrieve()
				.toBodilessEntity()
				.block();
		} catch (WebClientResponseException e) {
			log.error("플레이리스트 수정 실패: HTTP {} - {}", e.getStatusCode().value(), e.getResponseBodyAsString());
			throw new SpotifyApiException("플레이리스트 수정", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("플레이리스트 수정 실패: {}", e.getMessage(), e);
			throw new SpotifyApiException("플레이리스트 수정 중 오류가 발생했습니다.", 500, e);
		}
	}

	/**
	 * 플레이리스트 삭제 (언팔로우)
	 */
	public void deletePlaylist(UserPrincipal auth, String playlistId) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

		try {
			apiWebClient.delete()
				.uri("/v1/playlists/{playlist_id}/followers", playlistId)
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.toBodilessEntity()
				.block();
		} catch (WebClientResponseException e) {
			log.error("플레이리스트 삭제 실패: HTTP {} - {}", e.getStatusCode().value(), e.getResponseBodyAsString());
			throw new SpotifyApiException("플레이리스트 삭제", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("플레이리스트 삭제 실패: {}", e.getMessage(), e);
			throw new SpotifyApiException("플레이리스트 삭제 중 오류가 발생했습니다.", 500, e);
		}
	}

	/**
	 * 플레이리스트 트랙 목록 조회
	 */
	public Object getPlaylistTracks(UserPrincipal auth, String playlistId, Integer limit, Integer offset) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

		try {
			return apiWebClient.get()
				.uri(uriBuilder -> uriBuilder
					.path("/v1/playlists/{playlist_id}/tracks")
					.queryParamIfPresent("limit", java.util.Optional.ofNullable(limit))
					.queryParamIfPresent("offset", java.util.Optional.ofNullable(offset))
					.build(playlistId))
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.bodyToMono(Object.class)
				.block();
		} catch (WebClientResponseException e) {
			log.error("플레이리스트 트랙 조회 실패: HTTP {} - {}", e.getStatusCode().value(), e.getResponseBodyAsString());
			throw new SpotifyApiException("플레이리스트 트랙 조회", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("플레이리스트 트랙 조회 실패: {}", e.getMessage(), e);
			throw new SpotifyApiException("플레이리스트 트랙 조회 중 오류가 발생했습니다.", 500, e);
		}
	}

	/**
	 * 플레이리스트에 트랙 추가
	 */
	public Object addTracksToPlaylist(UserPrincipal auth, String playlistId, AddTracksToPlaylistRequest request) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

		Map<String, Object> requestBody = new HashMap<>();
		requestBody.put("uris", request.getUris());
		if (request.getPosition() != null) {
			requestBody.put("position", request.getPosition());
		}

		try {
			return apiWebClient.post()
				.uri("/v1/playlists/{playlist_id}/tracks", playlistId)
				.headers(h -> h.setBearerAuth(accessToken))
				.contentType(MediaType.APPLICATION_JSON)
				.bodyValue(requestBody)
				.retrieve()
				.bodyToMono(Object.class)
				.block();
		} catch (WebClientResponseException e) {
			log.error("플레이리스트 트랙 추가 실패: HTTP {} - {}", e.getStatusCode().value(), e.getResponseBodyAsString());
			throw new SpotifyApiException("플레이리스트 트랙 추가", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("플레이리스트 트랙 추가 실패: {}", e.getMessage(), e);
			throw new SpotifyApiException("플레이리스트 트랙 추가 중 오류가 발생했습니다.", 500, e);
		}
	}

	/**
	 * 플레이리스트에서 트랙 삭제
	 */
	public Object removeTracksFromPlaylist(UserPrincipal auth, String playlistId, RemoveTracksFromPlaylistRequest request) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

		Map<String, Object> requestBody = new HashMap<>();
		requestBody.put("tracks", request.getTracks());
		if (request.getSnapshotId() != null) {
			requestBody.put("snapshot_id", request.getSnapshotId());
		}

		try {
			return apiWebClient.method(HttpMethod.DELETE)
				.uri("/v1/playlists/{playlist_id}/tracks", playlistId)
				.headers(h -> h.setBearerAuth(accessToken))
				.contentType(MediaType.APPLICATION_JSON)
				.bodyValue(requestBody)
				.retrieve()
				.bodyToMono(Object.class)
				.block();
		} catch (WebClientResponseException e) {
			log.error("플레이리스트 트랙 삭제 실패: HTTP {} - {}", e.getStatusCode().value(), e.getResponseBodyAsString());
			throw new SpotifyApiException("플레이리스트 트랙 삭제", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("플레이리스트 트랙 삭제 실패: {}", e.getMessage(), e);
			throw new SpotifyApiException("플레이리스트 트랙 삭제 중 오류가 발생했습니다.", 500, e);
		}
	}

	// Private helper methods
	private SpotifyMe getUserProfile(String accessToken) {
		try {
			return apiWebClient.get()
				.uri("/v1/me")
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.bodyToMono(SpotifyMe.class)
				.block();
		} catch (Exception e) {
			log.error("사용자 프로필 조회 실패: {}", e.getMessage());
			return null;
		}
	}

	private Map<String, Object> createPlaylistRequestBody(CreatePlaylistRequest request) {
		Map<String, Object> requestBody = new HashMap<>();
		requestBody.put("name", request.getName());

		if (request.getDescription() != null && !request.getDescription().trim().isEmpty()) {
			requestBody.put("description", request.getDescription());
		}

		requestBody.put("public", request.getIsPublic() != null ? request.getIsPublic() : true);
		requestBody.put("collaborative", request.getCollaborative() != null ? request.getCollaborative() : false);

		return requestBody;
	}

	private Map<String, Object> createUpdateRequestBody(CreatePlaylistRequest request) {
		Map<String, Object> requestBody = new HashMap<>();

		if (request.getName() != null && !request.getName().trim().isEmpty()) {
			requestBody.put("name", request.getName());
		}

		if (request.getDescription() != null) {
			requestBody.put("description", request.getDescription());
		}

		if (request.getIsPublic() != null) {
			requestBody.put("public", request.getIsPublic());
		}

		if (request.getCollaborative() != null) {
			requestBody.put("collaborative", request.getCollaborative());
		}

		return requestBody;
	}
}
