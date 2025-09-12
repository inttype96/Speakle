package com.sevencode.speakle.spotify.service;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import com.sevencode.speakle.auth.dto.SpotifyTokenResponse;
import com.sevencode.speakle.common.service.StateStore;
import com.sevencode.speakle.common.util.CryptoUtil;
import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.spotify.config.SpotifyProps;
import com.sevencode.speakle.spotify.dto.response.SpotifyLinkStatusResponse;
import com.sevencode.speakle.spotify.dto.response.SpotifyMe;
import com.sevencode.speakle.spotify.entity.SpotifyAccount;
import com.sevencode.speakle.spotify.exception.InvalidStateException;
import com.sevencode.speakle.spotify.exception.SpotifyApiException;
import com.sevencode.speakle.spotify.exception.SpotifyNotLinkedException;
import com.sevencode.speakle.spotify.exception.SpotifyTokenException;
import com.sevencode.speakle.spotify.repository.SpotifyAccountRepository;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class SpotifyService {
	private final SpotifyProps props;
	private final SpotifyAccountRepository spotifyAccountRepository;
	private final CryptoUtil crypto;
	private final StateStore stateStore;
	private final WebClient accountsWebClient;
	private final WebClient apiWebClient;
	private final SpotifyTokenService spotifyTokenService;

	public SpotifyService(
		SpotifyProps props,
		SpotifyAccountRepository spotifyAccountRepository,
		CryptoUtil crypto,
		StateStore stateStore,
		@Qualifier("spotifyAccountsWebClient") WebClient accountsWebClient,
		@Qualifier("spotifyApiWebClient") WebClient apiWebClient,
		SpotifyTokenService spotifyTokenService
	) {
		this.props = props;
		this.spotifyAccountRepository = spotifyAccountRepository;
		this.crypto = crypto;
		this.stateStore = stateStore;
		this.accountsWebClient = accountsWebClient;
		this.apiWebClient = apiWebClient;
		this.spotifyTokenService = spotifyTokenService;
	}

	public String buildAuthorizeRedirect(UserPrincipal auth) {
		try {
			if (auth == null) {
				throw new IllegalArgumentException("사용자 인증 정보가 필요합니다.");
			}

			if (auth.userId() == null) {
				throw new IllegalArgumentException("사용자 ID가 필요합니다.");
			}

			String state = UUID.randomUUID().toString();
			stateStore.save(state, auth.userId());

			UriComponentsBuilder b = UriComponentsBuilder
				.fromHttpUrl("https://accounts.spotify.com/authorize")
				.queryParam("client_id", props.getClientId())
				.queryParam("response_type", "code")
				.queryParam("redirect_uri", props.getRedirectUri())
				.queryParam("scope", props.getScopes())
				.queryParam("state", state);

			log.info("Spotify OAuth URL 생성 완료 - userId: {}", auth.userId());
			return b.toUriString();

		} catch (Exception e) {
			log.error("Spotify OAuth URL 생성 실패 - userId: {}", auth != null ? auth.userId() : "null", e);
			throw new SpotifyApiException("Spotify 연결 URL 생성에 실패했습니다.", 500, e);
		}
	}

	@Transactional
	public void handleCallback(String code, String state) {
		try {
			if (code == null || code.isBlank()) {
				throw new IllegalArgumentException("인증 코드가 필요합니다.");
			}

			if (state == null || state.isBlank()) {
				throw new IllegalArgumentException("상태값이 필요합니다.");
			}

			Long userId = stateStore.consume(state)
				.orElseThrow(() -> new InvalidStateException("유효하지 않은 상태값입니다."));

			log.info("Spotify 콜백 처리 시작 - userId: {}", userId);

			// 토큰 교환
			SpotifyTokenResponse token = exchangeCodeForToken(code);

			// 사용자 정보 조회
			SpotifyMe me = fetchSpotifyUserProfile(token.getAccessToken());

			// 토큰 저장
			saveSpotifyAccount(userId, token, me);

			log.info("Spotify 계정 연동 완료 - userId: {}, spotifyUserId: {}", userId, me.getId());

		} catch (InvalidStateException | IllegalArgumentException e) {
			log.warn("Spotify 콜백 처리 실패: {}", e.getMessage());
			throw e;
		} catch (WebClientResponseException e) {
			log.error("Spotify API 호출 실패 - status: {}, body: {}", e.getStatusCode(), e.getResponseBodyAsString());
			throw new SpotifyApiException("Spotify API", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("Spotify 콜백 처리 중 예상치 못한 오류", e);
			throw new SpotifyApiException("Spotify 계정 연동에 실패했습니다.", 500, e);
		}
	}

	private SpotifyTokenResponse exchangeCodeForToken(String code) {
		try {
			MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
			form.add("grant_type", "authorization_code");
			form.add("code", code);
			form.add("redirect_uri", props.getRedirectUri());

			SpotifyTokenResponse token = accountsWebClient.post()
				.uri("/api/token")
				.headers(h -> h.setBasicAuth(props.getClientId(), props.getClientSecret()))
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.body(BodyInserters.fromFormData(form))
				.retrieve()
				.onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
					response -> response.bodyToMono(String.class)
						.map(body -> new SpotifyTokenException("토큰 발급 실패: " + response.statusCode())))
				.bodyToMono(SpotifyTokenResponse.class)
				.block();

			if (token == null || token.getAccessToken() == null) {
				throw new SpotifyTokenException("토큰 응답이 비어있습니다.");
			}

			return token;
		} catch (Exception e) {
			log.error("Spotify 토큰 교환 실패", e);
			throw new SpotifyTokenException("Spotify 토큰 발급에 실패했습니다.");
		}
	}

	private SpotifyMe fetchSpotifyUserProfile(String accessToken) {
		try {
			SpotifyMe me = apiWebClient.get()
				.uri("/v1/me")
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
					response -> response.bodyToMono(String.class)
						.map(body -> new SpotifyApiException("사용자 정보 조회", response.statusCode().value())))
				.bodyToMono(SpotifyMe.class)
				.block();

			if (me == null || me.getId() == null) {
				throw new SpotifyApiException("사용자 정보를 가져올 수 없습니다.", 500);
			}

			return me;
		} catch (Exception e) {
			log.error("Spotify 사용자 정보 조회 실패", e);
			throw new SpotifyApiException("Spotify 사용자 정보 조회에 실패했습니다.", 500, e);
		}
	}

	private void saveSpotifyAccount(Long userId, SpotifyTokenResponse token, SpotifyMe me) {
		try {
			long expiresAt = Instant.now().plusSeconds(token.getExpiresIn()).getEpochSecond();

			String accessEnc = crypto.encrypt(token.getAccessToken());
			String refreshEnc = crypto.encrypt(token.getRefreshToken());

			SpotifyAccount entity = spotifyAccountRepository.findByUserId(userId).orElseGet(SpotifyAccount::new);
			entity.setUserId(userId);
			entity.setProvider("spotify");
			entity.setSpotifyUserId(me.getId());
			entity.setAccessTokenEnc(accessEnc);
			entity.setRefreshTokenEnc(refreshEnc);
			entity.setExpiresAt(Instant.ofEpochSecond(expiresAt));
			entity.setScope(token.getScope());
			if (entity.getCreatedAt() == null) {
				entity.setCreatedAt(Instant.now());
			}

			spotifyAccountRepository.save(entity);
		} catch (Exception e) {
			log.error("Spotify 계정 정보 저장 실패 - userId: {}", userId, e);
			throw new SpotifyApiException("Spotify 계정 정보 저장에 실패했습니다.", 500, e);
		}
	}

	@Transactional
	public void disconnect(UserPrincipal auth) {
		try {
			if (auth == null || auth.userId() == null) {
				throw new IllegalArgumentException("사용자 인증 정보가 필요합니다.");
			}

			spotifyAccountRepository.deleteByUserId(auth.userId());
			log.info("Spotify 계정 연결 해제 완료 - userId: {}", auth.userId());

		} catch (Exception e) {
			log.error("Spotify 계정 연결 해제 실패 - userId: {}", auth != null ? auth.userId() : "null", e);
			throw new SpotifyApiException("Spotify 계정 연결 해제에 실패했습니다.", 500, e);
		}
	}

	public SpotifyLinkStatusResponse getStatus(UserPrincipal auth) {
		try {
			if (auth == null || auth.userId() == null) {
				throw new IllegalArgumentException("사용자 인증 정보가 필요합니다.");
			}

			return spotifyAccountRepository.findByUserId(auth.userId())
				.map(a -> new SpotifyLinkStatusResponse(true, a.getExpiresAtEpochSec(), a.getScope()))
				.orElseGet(() -> new SpotifyLinkStatusResponse(false, null, null));

		} catch (Exception e) {
			log.error("Spotify 연결 상태 조회 실패 - userId: {}", auth != null ? auth.userId() : "null", e);
			throw new SpotifyApiException("Spotify 연결 상태 조회에 실패했습니다.", 500, e);
		}
	}

	public Object getCurrentPlayback(UserPrincipal auth) {
		try {
			if (auth == null || auth.userId() == null) {
				throw new IllegalArgumentException("사용자 인증 정보가 필요합니다.");
			}

			String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

			return apiWebClient.get()
				.uri("/v1/me/player")
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
					response -> response.bodyToMono(String.class)
						.map(body -> new SpotifyApiException("재생 정보 조회", response.statusCode().value())))
				.bodyToMono(Object.class)
				.block();

		} catch (SpotifyNotLinkedException e) {
			throw e; // 그대로 전파
		} catch (WebClientResponseException e) {
			log.error("Spotify 재생 정보 조회 API 오류 - userId: {}, status: {}", Objects.requireNonNull(auth).userId(), e.getStatusCode());
			throw new SpotifyApiException("재생 정보 조회", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("재생 정보 조회 실패 - userId: {}", auth != null ? auth.userId() : "null", e);
			throw new SpotifyApiException("재생 정보 조회에 실패했습니다.", 500, e);
		}
	}

	public Object getUserProfile(UserPrincipal auth) {
		try {
			if (auth == null || auth.userId() == null) {
				throw new IllegalArgumentException("사용자 인증 정보가 필요합니다.");
			}

			String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

			return apiWebClient.get()
				.uri("/v1/me")
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
					response -> response.bodyToMono(String.class)
						.map(body -> new SpotifyApiException("사용자 프로필 조회", response.statusCode().value())))
				.bodyToMono(Object.class)
				.block();

		} catch (SpotifyNotLinkedException e) {
			throw e;
		} catch (WebClientResponseException e) {
			log.error("Spotify 프로필 조회 API 오류 - userId: {}, status: {}", Objects.requireNonNull(auth).userId(), e.getStatusCode());
			throw new SpotifyApiException("사용자 프로필 조회", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("사용자 프로필 조회 실패 - userId: {}", auth != null ? auth.userId() : "null", e);
			throw new SpotifyApiException("사용자 프로필 조회에 실패했습니다.", 500, e);
		}
	}

	public Object getUserPlaylists(UserPrincipal auth) {
		try {
			if (auth == null || auth.userId() == null) {
				throw new IllegalArgumentException("사용자 인증 정보가 필요합니다.");
			}

			String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

			return apiWebClient.get()
				.uri("/v1/me/playlists")
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
					response -> response.bodyToMono(String.class)
						.map(body -> new SpotifyApiException("플레이리스트 조회", response.statusCode().value())))
				.bodyToMono(Object.class)
				.block();

		} catch (SpotifyNotLinkedException e) {
			throw e;
		} catch (WebClientResponseException e) {
			log.error("Spotify 플레이리스트 조회 API 오류 - userId: {}, status: {}", Objects.requireNonNull(auth).userId(), e.getStatusCode());
			throw new SpotifyApiException("플레이리스트 조회", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("플레이리스트 조회 실패 - userId: {}", auth != null ? auth.userId() : "null", e);
			throw new SpotifyApiException("플레이리스트 조회에 실패했습니다.", 500, e);
		}
	}

	public void pausePlayback(UserPrincipal auth) {
		try {
			if (auth == null || auth.userId() == null) {
				throw new IllegalArgumentException("사용자 인증 정보가 필요합니다.");
			}

			String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

			apiWebClient.put()
				.uri("/v1/me/player/pause")
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
					response -> response.bodyToMono(String.class)
						.map(body -> new SpotifyApiException("재생 일시정지", response.statusCode().value())))
				.toBodilessEntity()
				.block();

		} catch (SpotifyNotLinkedException e) {
			throw e;
		} catch (WebClientResponseException e) {
			log.error("Spotify 재생 일시정지 API 오류 - userId: {}, status: {}", Objects.requireNonNull(auth).userId(), e.getStatusCode());
			throw new SpotifyApiException("재생 일시정지", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("재생 일시정지 실패 - userId: {}", auth != null ? auth.userId() : "null", e);
			throw new SpotifyApiException("재생 일시정지에 실패했습니다.", 500, e);
		}
	}

	public void resumePlayback(UserPrincipal auth) {
		try {
			if (auth == null || auth.userId() == null) {
				throw new IllegalArgumentException("사용자 인증 정보가 필요합니다.");
			}

			String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

			apiWebClient.put()
				.uri("/v1/me/player/play")
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
					response -> response.bodyToMono(String.class)
						.map(body -> new SpotifyApiException("재생 재개", response.statusCode().value())))
				.toBodilessEntity()
				.block();

		} catch (SpotifyNotLinkedException e) {
			throw e;
		} catch (WebClientResponseException e) {
			log.error("Spotify 재생 재개 API 오류 - userId: {}, status: {}", Objects.requireNonNull(auth).userId(), e.getStatusCode());
			throw new SpotifyApiException("재생 재개", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("재생 재개 실패 - userId: {}", auth != null ? auth.userId() : "null", e);
			throw new SpotifyApiException("재생 재개에 실패했습니다.", 500, e);
		}
	}

	public void skipToNext(UserPrincipal auth) {
		try {
			if (auth == null || auth.userId() == null) {
				throw new IllegalArgumentException("사용자 인증 정보가 필요합니다.");
			}

			String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

			apiWebClient.post()
				.uri("/v1/me/player/next")
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
					response -> response.bodyToMono(String.class)
						.map(body -> new SpotifyApiException("다음 트랙", response.statusCode().value())))
				.toBodilessEntity()
				.block();

		} catch (SpotifyNotLinkedException e) {
			throw e;
		} catch (WebClientResponseException e) {
			log.error("Spotify 다음 트랙 API 오류 - userId: {}, status: {}", Objects.requireNonNull(auth).userId(), e.getStatusCode());
			throw new SpotifyApiException("다음 트랙", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("다음 트랙 이동 실패 - userId: {}", auth != null ? auth.userId() : "null", e);
			throw new SpotifyApiException("다음 트랙 이동에 실패했습니다.", 500, e);
		}
	}

	public void skipToPrevious(UserPrincipal auth) {
		try {
			if (auth == null || auth.userId() == null) {
				throw new IllegalArgumentException("사용자 인증 정보가 필요합니다.");
			}

			String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());

			apiWebClient.post()
				.uri("/v1/me/player/previous")
				.headers(h -> h.setBearerAuth(accessToken))
				.retrieve()
				.onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
					response -> response.bodyToMono(String.class)
						.map(body -> new SpotifyApiException("이전 트랙", response.statusCode().value())))
				.toBodilessEntity()
				.block();

		} catch (SpotifyNotLinkedException e) {
			throw e;
		} catch (WebClientResponseException e) {
			log.error("Spotify 이전 트랙 API 오류 - userId: {}, status: {}", Objects.requireNonNull(auth).userId(), e.getStatusCode());
			throw new SpotifyApiException("이전 트랙", e.getStatusCode().value());
		} catch (Exception e) {
			log.error("이전 트랙 이동 실패 - userId: {}", auth != null ? auth.userId() : "null", e);
			throw new SpotifyApiException("이전 트랙 이동에 실패했습니다.", 500, e);
		}
	}
}
