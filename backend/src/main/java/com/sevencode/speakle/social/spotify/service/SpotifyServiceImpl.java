package com.sevencode.speakle.social.spotify.service;

import com.sevencode.speakle.social.spotify.config.SpotifyProperties;
import com.sevencode.speakle.social.spotify.dto.request.SpotifyConnectRequest;
import com.sevencode.speakle.social.spotify.dto.response.ProfileMe;
import com.sevencode.speakle.social.spotify.dto.response.SpotifyAccountInfoResponse;
import com.sevencode.speakle.social.spotify.dto.response.TokenResponse;
import com.sevencode.speakle.social.spotify.entity.SpotifyTokenEntity;
import com.sevencode.speakle.social.spotify.entity.UserSocialAccountEntity;
import com.sevencode.speakle.social.spotify.exception.SpotifyAuthException;
import com.sevencode.speakle.social.spotify.repository.SpotifyTokenRepository;
import com.sevencode.speakle.social.spotify.repository.UserSocialAccountRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Optional;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
@Transactional
public class SpotifyServiceImpl implements SpotifyService {

	private static final String PROVIDER = "spotify";

	private final WebClient spotifyAuthClient; // Spotify 인증 서버 (accounts.spotify.com)
	private final WebClient spotifyApiClient;  // Spotify API 서버 (api.spotify.com/v1)
	private final SpotifyProperties props;     // clientId, clientSecret, redirectUri
	private final CryptoService crypto;        // 토큰 암호화/복호화
	private final UserSocialAccountRepository accountRepo; // 유저 ↔ 소셜계정 연결 테이블
	private final SpotifyTokenRepository tokenRepo;         // Spotify 토큰 저장소

	/**
	 * Spotify 계정 연결 처리
	 * FE → BE로 Authorization Code가 전달되면 여기서 Spotify와 통신해 AccessToken/RefreshToken을 발급받고,
	 * 유저 DB에 연결정보와 토큰을 저장한다.
	 */
	@Override
	public SpotifyAccountInfoResponse connect(Long userId, SpotifyConnectRequest req) {
		// 1. Authorization Code → Access/Refresh Token 교환
		TokenResponse token = exchangeAuthorizationCode(req.getAuthorizationCode(), req.getRedirectUri());

		// 2. Access Token으로 Spotify /me API 호출 → 계정 식별자(id, email 등)
		ProfileMe me = fetchMe(token.access_token());

		String spotifyUserId = me.id();
		String scope = token.scope();
		OffsetDateTime exp = OffsetDateTime.now(ZoneOffset.UTC)
			.plusSeconds(token.expires_in() != null ? token.expires_in() : 3600);

		// 3. User ↔ Spotify 계정 연결정보 저장 (업서트)
		var link = accountRepo.findByUserIdAndProvider(userId, PROVIDER).orElseGet(UserSocialAccountEntity::new);
		link.setUserId(userId);
		link.setProvider(PROVIDER);
		link.setProviderUserId(spotifyUserId);
		accountRepo.save(link);

		// 4. Token 저장 (업서트, refresh_token이 내려오지 않는 경우도 있음 → null 방어 필요)
		var t = tokenRepo.findByUserIdAndProvider(userId, PROVIDER).orElseGet(SpotifyTokenEntity::new);
		t.setUserId(userId);
		t.setProvider(PROVIDER);
		t.setSpotifyUserId(spotifyUserId);
		t.setAccessTokenEnc(crypto.encrypt(token.access_token())); // DB에는 평문 저장 금지
		if (token.refresh_token() != null && !token.refresh_token().isBlank()) {
			t.setRefreshTokenEnc(crypto.encrypt(token.refresh_token()));
		}
		t.setScope(scope);
		t.setExpiresAt(exp);
		tokenRepo.save(t);

		// 5. FE에 응답 (민감정보 제외)
		return new SpotifyAccountInfoResponse(PROVIDER, spotifyUserId, scope, exp);
	}

	/**
	 * 저장된 연결정보 조회
	 * 주의: 이 메소드에서는 AccessToken을 노출하지 않고,
	 * FE가 필요로 하는 최소정보(Spotify UserId, Scope, Expiration)만 반환한다.
	 */
	@Override
	@Transactional(readOnly = true)
	public SpotifyAccountInfoResponse getInfo(Long userId) {
		var t = tokenRepo.findByUserIdAndProvider(userId, PROVIDER)
			.orElseThrow(() -> new IllegalArgumentException("연결된 Spotify 계정이 없습니다."));
		return new SpotifyAccountInfoResponse(PROVIDER, t.getSpotifyUserId(), t.getScope(), t.getExpiresAt());
	}

	/**
	 * 연결 해제
	 * 순서 중요: Token → Account 순서로 지워야 FK 제약 위반 방지 가능
	 */
	@Override
	public void disconnect(Long userId) {
		tokenRepo.deleteByUserIdAndProvider(userId, PROVIDER);
		accountRepo.deleteByUserIdAndProvider(userId, PROVIDER);
	}

	/**
	 * AccessToken 갱신
	 * - AccessToken이 만료 직전이면 refresh_token을 사용해서 Spotify에 재요청
	 * - Spotify는 가끔 refresh_token도 새로 내려주므로, 있으면 갱신해 줘야 함
	 */
	@Override
	public SpotifyAccountInfoResponse refreshAccessToken(Long userId) {
		// 1. DB에서 기존 토큰 조회
		var t = tokenRepo.findByUserIdAndProvider(userId, PROVIDER)
			.orElseThrow(() -> new IllegalArgumentException("연결된 Spotify 계정이 없습니다."));

		// 2. 아직 만료가 30초 이상 남았으면 재사용
		if (t.getExpiresAt() != null && t.getExpiresAt().isAfter(now().plusSeconds(30))) {
			return new SpotifyAccountInfoResponse(PROVIDER, t.getSpotifyUserId(), t.getScope(), t.getExpiresAt());
		}

		// 3. refresh_token이 없으면 갱신 불가 (처음부터 다시 connect 필요)
		if (t.getRefreshTokenEnc() == null || t.getRefreshTokenEnc().isBlank()) {
			throw new IllegalStateException("저장된 refresh_token이 없어 갱신할 수 없습니다. 다시 연결해주세요.");
		}

		// 4. refresh_token으로 Spotify /api/token 호출 (grant_type=refresh_token)
		String refreshPlain = crypto.decrypt(t.getRefreshTokenEnc());
		TokenResponse res = refreshWithSpotify(refreshPlain);

		// 5. 응답 결과로 DB 업데이트
		t.setAccessTokenEnc(crypto.encrypt(res.access_token()));
		OffsetDateTime newExp = now().plusSeconds(Optional.ofNullable(res.expires_in()).orElse(3600));
		t.setExpiresAt(newExp);
		if (res.scope() != null && !res.scope().isBlank()) {
			t.setScope(res.scope());
		}
		if (res.refresh_token() != null && !res.refresh_token().isBlank()) {
			t.setRefreshTokenEnc(crypto.encrypt(res.refresh_token()));
		}
		tokenRepo.save(t);

		return new SpotifyAccountInfoResponse(PROVIDER, t.getSpotifyUserId(), t.getScope(), newExp);
	}

	// === 내부 유틸 메소드 ===

	private static OffsetDateTime now() {
		return OffsetDateTime.now(ZoneOffset.UTC);
	}

	/**
	 * Authorization Code → Token 교환
	 * Spotify Auth 서버(/api/token)에 POST 요청
	 * 실패 시 SpotifyAuthException 발생
	 */
	private TokenResponse exchangeAuthorizationCode(String code, String redirectUriFromFE) {
		String redirectUri = (redirectUriFromFE != null && !redirectUriFromFE.isBlank())
			? redirectUriFromFE
			: props.getRedirectUri();

		return spotifyAuthClient.post()
			.uri("/api/token")
			.headers(h -> {
				h.setBasicAuth(props.getClientId(), props.getClientSecret()); // Client 인증
				h.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE);
			})
			.body(BodyInserters
				.fromFormData("grant_type", "authorization_code")
				.with("code", code)
				.with("redirect_uri", redirectUri))
			.retrieve()
			.onStatus(HttpStatusCode::isError,
				resp -> resp.bodyToMono(String.class)
					.defaultIfEmpty("")
					.map(body -> (Throwable)new SpotifyAuthException("token_exchange_failed: " + body)))
			.bodyToMono(TokenResponse.class)
			.block(); // 동기 블록 (주의: reactive stack에서는 비권장)
	}

	/**
	 * Spotify 프로필 조회 (/v1/me)
	 * AccessToken으로 Spotify 계정 소유자 정보 확인
	 * → FE에서 전달한 값 신뢰하지 않고, Spotify가 검증한 계정정보 사용
	 */
	private ProfileMe fetchMe(String accessToken) {
		return spotifyApiClient.get()
			.uri("/me")
			.headers(h -> h.setBearerAuth(accessToken))
			.retrieve()
			.onStatus(HttpStatusCode::isError,
				resp -> resp.bodyToMono(String.class)
					.defaultIfEmpty("")
					.map(body -> (Throwable)new SpotifyAuthException("fetch_me_failed: " + body)))
			.bodyToMono(ProfileMe.class)
			.block();
	}

	/**
	 * RefreshToken으로 AccessToken 재발급
	 * Spotify Auth 서버(/api/token, grant_type=refresh_token) 호출
	 */
	private TokenResponse refreshWithSpotify(String refreshTokenPlain) {
		return spotifyAuthClient.post()
			.uri("/api/token")
			.headers(h -> {
				h.setBasicAuth(props.getClientId(), props.getClientSecret());
				h.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE);
			})
			.body(BodyInserters
				.fromFormData("grant_type", "refresh_token")
				.with("refresh_token", refreshTokenPlain))
			.retrieve()
			.onStatus(HttpStatusCode::isError,
				resp -> resp.bodyToMono(String.class)
					.defaultIfEmpty("")
					.map(body -> (Throwable)new SpotifyAuthException("token_refresh_failed: " + body)))
			.bodyToMono(TokenResponse.class)
			.block();
	}
}
