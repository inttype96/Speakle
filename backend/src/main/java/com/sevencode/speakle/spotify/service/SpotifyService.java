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
import com.sevencode.speakle.spotify.repository.SpotifyAccountRepository;

import jakarta.transaction.Transactional;

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
		String state = UUID.randomUUID().toString();
		stateStore.save(state, auth.userId());
		UriComponentsBuilder b = UriComponentsBuilder
			.fromHttpUrl("https://accounts.spotify.com/authorize")
			.queryParam("client_id", props.getClientId())
			.queryParam("response_type", "code")
			.queryParam("redirect_uri", props.getRedirectUri())
			.queryParam("scope", props.getScopes())
			.queryParam("state", state);
		return b.toUriString();
	}

	@Transactional
	public void handleCallback(String code, String state) {
		Long userId = stateStore.consume(state)
			.orElseThrow(InvalidStateException::new);

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
			.bodyToMono(SpotifyTokenResponse.class)
			.block();

		SpotifyMe me = apiWebClient.get()
			.uri("/v1/me")
			.headers(h -> h.setBearerAuth(Objects.requireNonNull(token).getAccessToken()))
			.retrieve()
			.bodyToMono(SpotifyMe.class)
			.block();

		long expiresAt = Instant.now().plusSeconds(Objects.requireNonNull(token).getExpiresIn()).getEpochSecond();

		String accessEnc = crypto.encrypt(token.getAccessToken());
		String refreshEnc = crypto.encrypt(token.getRefreshToken());

		SpotifyAccount entity = spotifyAccountRepository.findByUserId(userId).orElseGet(SpotifyAccount::new);
		entity.setUserId(userId);
		entity.setProvider("spotify");
		entity.setSpotifyUserId(Objects.requireNonNull(me).getId());
		entity.setAccessTokenEnc(accessEnc);
		entity.setRefreshTokenEnc(refreshEnc);
		entity.setExpiresAt(Instant.ofEpochSecond(expiresAt));
		entity.setScope(token.getScope());
		if (entity.getCreatedAt() == null) {
			entity.setCreatedAt(Instant.now());
		}
		spotifyAccountRepository.save(entity);
	}

	@Transactional
	public void disconnect(UserPrincipal auth) {
		spotifyAccountRepository.deleteByUserId(auth.userId());
	}

	public SpotifyLinkStatusResponse getStatus(UserPrincipal auth) {
		return spotifyAccountRepository.findByUserId(auth.userId())
			.map(a -> new SpotifyLinkStatusResponse(true, a.getExpiresAtEpochSec(), a.getScope()))
			.orElseGet(() -> new SpotifyLinkStatusResponse(false, null, null));
	}

	public Object getCurrentPlayback(UserPrincipal auth) {
		// 다른 서비스의 메서드를 호출 → 트랜잭션 정상 작동
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());
		return apiWebClient.get()
			.uri("/v1/me/player")
			.headers(h -> h.setBearerAuth(accessToken))
			.retrieve()
			.bodyToMono(Object.class)
			.block();
	}

	public Object getUserProfile(UserPrincipal auth) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());
		return apiWebClient.get()
			.uri("/v1/me")
			.headers(h -> h.setBearerAuth(accessToken))
			.retrieve()
			.bodyToMono(Object.class)
			.block();
	}

	public Object getUserPlaylists(UserPrincipal auth) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());
		return apiWebClient.get()
			.uri("/v1/me/playlists")
			.headers(h -> h.setBearerAuth(accessToken))
			.retrieve()
			.bodyToMono(Object.class)
			.block();
	}

	public void pausePlayback(UserPrincipal auth) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());
		apiWebClient.put()
			.uri("/v1/me/player/pause")
			.headers(h -> h.setBearerAuth(accessToken))
			.retrieve()
			.toBodilessEntity()
			.block();
	}

	public void resumePlayback(UserPrincipal auth) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());
		apiWebClient.put()
			.uri("/v1/me/player/play")
			.headers(h -> h.setBearerAuth(accessToken))
			.retrieve()
			.toBodilessEntity()
			.block();
	}

	public void skipToNext(UserPrincipal auth) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());
		apiWebClient.post()
			.uri("/v1/me/player/next")
			.headers(h -> h.setBearerAuth(accessToken))
			.retrieve()
			.toBodilessEntity()
			.block();
	}

	public void skipToPrevious(UserPrincipal auth) {
		String accessToken = spotifyTokenService.resolveValidAccessToken(auth.userId());
		apiWebClient.post()
			.uri("/v1/me/player/previous")
			.headers(h -> h.setBearerAuth(accessToken))
			.retrieve()
			.toBodilessEntity()
			.block();
	}
}
