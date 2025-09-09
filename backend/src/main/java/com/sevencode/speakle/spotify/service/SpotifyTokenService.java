package com.sevencode.speakle.spotify.service;

import java.time.Instant;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import com.sevencode.speakle.auth.dto.SpotifyTokenResponse;
import com.sevencode.speakle.common.util.CryptoUtil;
import com.sevencode.speakle.spotify.config.SpotifyProps;
import com.sevencode.speakle.spotify.entity.SpotifyAccount;
import com.sevencode.speakle.spotify.exception.SpotifyNotLinkedException;
import com.sevencode.speakle.spotify.exception.SpotifyTokenException;
import com.sevencode.speakle.spotify.repository.SpotifyAccountRepository;

import jakarta.transaction.Transactional;

@Service
public class SpotifyTokenService {
	private final SpotifyAccountRepository spotifyAccountRepository;
	private final CryptoUtil crypto;
	private final WebClient accountsWebClient;
	private final SpotifyProps props;

	public SpotifyTokenService(
		SpotifyProps props,
		SpotifyAccountRepository spotifyAccountRepository,
		CryptoUtil crypto,
		@Qualifier("spotifyAccountsWebClient") WebClient accountsWebClient
	) {
		this.props = props;
		this.spotifyAccountRepository = spotifyAccountRepository;
		this.crypto = crypto;
		this.accountsWebClient = accountsWebClient;
	}

	@Transactional
	public String resolveValidAccessToken(Long userId) {
		SpotifyAccount acc = spotifyAccountRepository.findByUserId(userId)
			.orElseThrow(() -> new SpotifyNotLinkedException("user"));

		if (Instant.now().getEpochSecond() < acc.getExpiresAtEpochSec() - 30) {
			return crypto.decrypt(acc.getAccessTokenEnc());
		}

		// refresh 토큰 로직
		String refresh = crypto.decrypt(acc.getRefreshTokenEnc());
		MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
		form.add("grant_type", "refresh_token");
		form.add("refresh_token", refresh);

		SpotifyTokenResponse token = accountsWebClient.post()
			.uri("/api/token")
			.headers(h -> h.setBasicAuth(props.getClientId(), props.getClientSecret()))
			.contentType(MediaType.APPLICATION_FORM_URLENCODED)
			.body(BodyInserters.fromFormData(form))
			.retrieve()
			.onStatus(status -> status.is4xxClientError() || status.is5xxServerError(), 
				response -> response.bodyToMono(String.class)
					.map(body -> new SpotifyTokenException("토큰 갱신 실패: " + response.statusCode())))
			.bodyToMono(SpotifyTokenResponse.class)
			.block();

		acc.setAccessTokenEnc(crypto.encrypt(Objects.requireNonNull(token).getAccessToken()));
		if (token.getRefreshToken() != null) {
			acc.setRefreshTokenEnc(crypto.encrypt(token.getRefreshToken()));
		}
		acc.setExpiresAt(Instant.now().plusSeconds(token.getExpiresIn()));
		spotifyAccountRepository.save(acc);

		return crypto.decrypt(acc.getAccessTokenEnc());
	}
}
