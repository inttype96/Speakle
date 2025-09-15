package com.sevencode.speakle.spotify.service;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.sevencode.speakle.auth.dto.SpotifyTokenResponse;
import com.sevencode.speakle.common.util.CryptoUtil;
import com.sevencode.speakle.spotify.config.SpotifyProps;
import com.sevencode.speakle.spotify.entity.SpotifyAccount;
import com.sevencode.speakle.spotify.exception.SpotifyApiException;
import com.sevencode.speakle.spotify.exception.SpotifyNotLinkedException;
import com.sevencode.speakle.spotify.exception.SpotifyRateLimitException;
import com.sevencode.speakle.spotify.exception.SpotifyTokenException;
import com.sevencode.speakle.spotify.repository.SpotifyAccountRepository;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
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
		log.debug("토큰 유효성 검사 시작 - userId: {}", userId);

		try {
			SpotifyAccount acc = spotifyAccountRepository.findByUserId(userId)
				.orElseThrow(() -> new SpotifyNotLinkedException("user"));

			// 토큰이 아직 유효한지 확인 (30초 여유시간)
			if (Instant.now().getEpochSecond() < acc.getExpiresAtEpochSec() - 30) {
				log.debug("기존 토큰이 유효함 - userId: {}", userId);
				return decryptAccessToken(acc, "기존 액세스 토큰");
			}

			log.info("토큰 만료됨, 갱신 시작 - userId: {}", userId);
			return refreshAccessToken(acc);

		} catch (SpotifyNotLinkedException e) {
			log.warn("Spotify 계정 미연결 - userId: {}, message: {}", userId, e.getMessage());
			// 사용자에게 구체적인 피드백을 위한 추가 컨텍스트 로깅
			log.info("사용자 액션 필요 - userId: {}, 해결방법: 설정에서 Spotify 계정 연결", userId);
			throw e;
		} catch (SpotifyTokenException e) {
			log.error("토큰 관련 오류 - userId: {}, 오류유형: {}, message: {}", 
				userId, e.getClass().getSimpleName(), e.getMessage());
			// 토큰 문제 발생 시 재연결 권장 로깅
			log.info("토큰 복구 권장 - userId: {}, 해결방법: Spotify 계정 재연결", userId);
			throw e;
		} catch (SpotifyApiException e) {
			log.error("Spotify API 오류 - userId: {}, statusCode: {}, message: {}", 
				userId, e.getStatusCode(), e.getMessage());
			// API 오류에 대한 구체적인 대응 방안 로깅
			if (e.getStatusCode() >= 500) {
				log.info("서버 오류 감지 - userId: {}, 권장사항: 잠시 후 재시도", userId);
			}
			throw e;
		} catch (SpotifyRateLimitException e) {
			log.warn("API 요청 한도 초과 - userId: {}, retryAfter: {}초, message: {}", 
				userId, e.getRetryAfterSeconds(), e.getMessage());
			// 사용자 경험 개선을 위한 구체적인 안내 로깅
			log.info("사용자 대기 필요 - userId: {}, 권장사항: {}초 후 재시도", userId, e.getRetryAfterSeconds());
			throw e;
		} catch (Exception e) {
			log.error("토큰 처리 중 예상치 못한 오류 발생 - userId: {}, errorType: {}", 
				userId, e.getClass().getSimpleName(), e);
			// 시스템 오류에 대한 추적 가능한 로깅
			log.error("시스템 오류 상세 - userId: {}, stackTrace: {}", userId, e.getStackTrace());
			throw new SpotifyTokenException("토큰 처리 중 시스템 오류가 발생했습니다. 다시 시도해 주세요.");
		}
	}

	/**
	 * 액세스 토큰 복호화 공통 메서드
	 */
	private String decryptAccessToken(SpotifyAccount acc, String tokenType) {
		try {
			return crypto.decrypt(acc.getAccessTokenEnc());
		} catch (Exception e) {
			log.error("{} 복호화 실패 - userId: {}", tokenType, acc.getUserId(), e);
			throw new SpotifyTokenException(tokenType, "복호화 실패");
		}
	}

	/**
	 * refresh 토큰으로 액세스 토큰 갱신
	 */
	private String refreshAccessToken(SpotifyAccount acc) {
		try {
			log.debug("refresh 토큰으로 액세스 토큰 갱신 시작 - userId: {}", acc.getUserId());

			String refreshToken = decryptRefreshToken(acc);
			MultiValueMap<String, String> form = createTokenRefreshForm(refreshToken);
			SpotifyTokenResponse tokenResponse = requestTokenRefresh(form);
			
			updateTokensInDatabase(acc, tokenResponse);

			log.info("토큰 갱신 완료 - userId: {}", acc.getUserId());
			return decryptAccessToken(acc, "갱신된 액세스 토큰");

		} catch (SpotifyTokenException | SpotifyApiException | SpotifyRateLimitException e) {
			throw e;
		} catch (Exception e) {
			log.error("토큰 갱신 중 예상치 못한 오류 - userId: {}", acc.getUserId(), e);
			throw new SpotifyTokenException("토큰 갱신 중 시스템 오류가 발생했습니다.");
		}
	}

	/**
	 * refresh 토큰 복호화
	 */
	private String decryptRefreshToken(SpotifyAccount acc) {
		try {
			return crypto.decrypt(acc.getRefreshTokenEnc());
		} catch (Exception e) {
			log.error("refresh 토큰 복호화 실패 - userId: {}", acc.getUserId(), e);
			throw new SpotifyTokenException("refresh 토큰", "복호화 실패");
		}
	}

	/**
	 * 토큰 갱신 요청 폼 데이터 생성
	 */
	private MultiValueMap<String, String> createTokenRefreshForm(String refreshToken) {
		MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
		form.add("grant_type", "refresh_token");
		form.add("refresh_token", refreshToken);
		return form;
	}

	/**
	 * Spotify API에 토큰 갱신 요청 (간소화된 버전)
	 */
	private SpotifyTokenResponse requestTokenRefresh(MultiValueMap<String, String> form) {
		try {
			SpotifyTokenResponse response = accountsWebClient.post()
				.uri("/api/token")
				.headers(h -> h.setBasicAuth(props.getClientId(), props.getClientSecret()))
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.body(BodyInserters.fromFormData(form))
				.retrieve()
				.bodyToMono(SpotifyTokenResponse.class)
				.block();

			if (response == null) {
				throw new SpotifyTokenException("토큰 응답이 비어있습니다.");
			}

			return response;

		} catch (WebClientResponseException e) {
			handleWebClientResponseException(e);
			return null; // 이 라인은 실행되지 않지만 컴파일러를 위해 필요
		} catch (WebClientException e) {
			log.error("Spotify 토큰 갱신 요청 실패 - 네트워크 오류", e);
			throw new SpotifyTokenException("네트워크 연결 오류로 토큰 갱신에 실패했습니다. 인터넷 연결을 확인해 주세요.");
		} catch (Exception e) {
			log.error("토큰 갱신 요청 중 예상치 못한 오류", e);
			throw new SpotifyTokenException("토큰 갱신 요청 중 오류가 발생했습니다.");
		}
	}

	/**
	 * WebClient 응답 예외 처리 공통 메서드
	 */
	private void handleWebClientResponseException(WebClientResponseException e) {
		log.error("Spotify 토큰 갱신 API 호출 실패 - status: {}, body: {}",
			e.getStatusCode(), e.getResponseBodyAsString());

		int statusCode = e.getStatusCode().value();
		switch (statusCode) {
			case 400 -> throw new SpotifyTokenException("refresh 토큰이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요.");
			case 401 -> throw new SpotifyApiException("토큰 갱신", statusCode);
			case 429 -> throw new SpotifyRateLimitException(parseRetryAfterHeader(e));
			case 500, 502, 503 -> throw new SpotifyApiException("토큰 갱신", statusCode);
			default -> throw new SpotifyTokenException(
				String.format("토큰 갱신 실패 (상태코드: %d). 잠시 후 다시 시도해 주세요.", statusCode));
		}
	}

	/**
	 * Retry-After 헤더 파싱
	 */
	private int parseRetryAfterHeader(WebClientResponseException e) {
		int retrySeconds = 60; // 기본값
		try {
			String retryAfter = e.getHeaders().getFirst("Retry-After");
			if (retryAfter != null) {
				retrySeconds = Integer.parseInt(retryAfter);
			}
		} catch (NumberFormatException ex) {
			log.warn("Retry-After 헤더 파싱 실패, 기본값 사용: {}", ex.getMessage());
		}
		return retrySeconds;
	}

	/**
	 * DB에 토큰 정보 업데이트 (단일 책임으로 분리)
	 */
	private void updateTokensInDatabase(SpotifyAccount acc, SpotifyTokenResponse tokenResponse) {
		try {
			validateTokenResponse(tokenResponse);
			
			encryptAndSaveAccessToken(acc, tokenResponse);
			updateRefreshTokenIfPresent(acc, tokenResponse);
			updateTokenExpirationTime(acc, tokenResponse);
			
			saveSpotifyAccount(acc);

		} catch (Exception e) {
			log.error("토큰 정보 DB 업데이트 실패 - userId: {}", acc.getUserId(), e);
			if (e instanceof SpotifyTokenException) {
				throw e;
			}
			throw new SpotifyTokenException("토큰 정보 저장 중 오류가 발생했습니다.");
		}
	}

	/**
	 * 토큰 응답 유효성 검사
	 */
	private void validateTokenResponse(SpotifyTokenResponse tokenResponse) {
		if (tokenResponse == null) {
			throw new SpotifyTokenException("토큰 응답이 비어있습니다.");
		}
		
		String accessToken = tokenResponse.getAccessToken();
		if (accessToken == null || accessToken.trim().isEmpty()) {
			throw new SpotifyTokenException("응답에서 액세스 토큰을 찾을 수 없습니다.");
		}
	}

	/**
	 * 액세스 토큰 암호화 및 저장
	 */
	private void encryptAndSaveAccessToken(SpotifyAccount acc, SpotifyTokenResponse tokenResponse) {
		try {
			String encryptedAccessToken = crypto.encrypt(tokenResponse.getAccessToken());
			acc.setAccessTokenEnc(encryptedAccessToken);
			log.debug("액세스 토큰 암호화 완료 - userId: {}", acc.getUserId());
		} catch (Exception e) {
			log.error("액세스 토큰 암호화 실패 - userId: {}", acc.getUserId(), e);
			throw new SpotifyTokenException("액세스 토큰 암호화 중 오류가 발생했습니다.");
		}
	}

	/**
	 * refresh 토큰이 있는 경우 업데이트
	 */
	private void updateRefreshTokenIfPresent(SpotifyAccount acc, SpotifyTokenResponse tokenResponse) {
		if (tokenResponse.getRefreshToken() != null) {
			try {
				String encryptedRefreshToken = crypto.encrypt(tokenResponse.getRefreshToken());
				acc.setRefreshTokenEnc(encryptedRefreshToken);
				log.debug("새로운 refresh 토큰으로 업데이트됨 - userId: {}", acc.getUserId());
			} catch (Exception e) {
				log.error("refresh 토큰 암호화 실패 - userId: {}", acc.getUserId(), e);
				throw new SpotifyTokenException("refresh 토큰 암호화 중 오류가 발생했습니다.");
			}
		}
	}

	/**
	 * 토큰 만료 시간 업데이트
	 */
	private void updateTokenExpirationTime(SpotifyAccount acc, SpotifyTokenResponse tokenResponse) {
		try {
			int expiresIn = Math.toIntExact(tokenResponse.getExpiresIn());
			if (expiresIn <= 0) {
				log.warn("유효하지 않은 만료시간, 기본값 사용 - userId: {}, expiresIn: {}",
					acc.getUserId(), expiresIn);
				expiresIn = 3600; // 기본 1시간
			}
			
			Instant expirationTime = Instant.now().plusSeconds(expiresIn);
			acc.setExpiresAt(expirationTime);
			log.debug("토큰 만료 시간 업데이트 완료 - userId: {}, expiresAt: {}", 
				acc.getUserId(), expirationTime);
		} catch (Exception e) {
			log.error("토큰 만료 시간 업데이트 실패 - userId: {}", acc.getUserId(), e);
			throw new SpotifyTokenException("토큰 만료 시간 설정 중 오류가 발생했습니다.");
		}
	}

	/**
	 * SpotifyAccount 엔티티 저장
	 */
	private void saveSpotifyAccount(SpotifyAccount acc) {
		try {
			spotifyAccountRepository.save(acc);
			log.debug("토큰 정보 DB 저장 완료 - userId: {}", acc.getUserId());
		} catch (Exception e) {
			log.error("SpotifyAccount 저장 실패 - userId: {}", acc.getUserId(), e);
			throw new SpotifyTokenException("토큰 정보 데이터베이스 저장 중 오류가 발생했습니다.");
		}
	}
}


/*

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

 */
