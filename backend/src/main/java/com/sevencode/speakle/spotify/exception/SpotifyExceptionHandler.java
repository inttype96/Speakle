package com.sevencode.speakle.spotify.exception;

import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import com.sevencode.speakle.common.exception.CryptoException;
import com.sevencode.speakle.common.exception.StateStoreException;
import com.sevencode.speakle.spotify.dto.response.SpotifyErrorResponse;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Order(1)
@RestControllerAdvice(basePackages = "com.sevencode.speakle.spotify")
public class SpotifyExceptionHandler {

	@ExceptionHandler(SpotifyNotLinkedException.class)
	public ResponseEntity<SpotifyErrorResponse> handleSpotifyNotLinked(
		SpotifyNotLinkedException ex, WebRequest request) {
		// 민감한 사용자 정보 로그 제거
		log.warn("Spotify 계정 미연결 요청 - 경로: {}", getRequestPath(request));

		SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
			"SPOTIFY_NOT_LINKED",
			"Spotify 계정이 연결되어 있지 않습니다. 먼저 Spotify 계정을 연결해 주세요.",
			HttpStatus.NOT_FOUND.value(),
			getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
	}

	@ExceptionHandler(InvalidStateException.class)
	public ResponseEntity<SpotifyErrorResponse> handleInvalidState(
		InvalidStateException ex, WebRequest request) {
		// 상태값 자체는 로그에 남기지 않음 (보안상 민감)
		log.warn("OAuth 상태값 검증 실패 - 경로: {}", getRequestPath(request));

		SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
			"INVALID_OAUTH_STATE",
			"인증 요청이 유효하지 않거나 만료되었습니다. 새로고침 후 다시 시도해 주세요.",
			HttpStatus.BAD_REQUEST.value(),
			getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
	}

	@ExceptionHandler(SpotifyApiException.class)
	public ResponseEntity<SpotifyErrorResponse> handleSpotifyApi(
		SpotifyApiException ex, WebRequest request) {
		log.warn("Spotify API 오류 - API: {}, 상태코드: {}, 경로: {}",
			ex.getApiName(), ex.getStatusCode(), getRequestPath(request));

		HttpStatus httpStatus = mapSpotifyStatusToHttp(ex.getStatusCode());
		String userMessage = getUserFriendlyMessage(ex.getStatusCode(), ex.getApiName());

		SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
			"SPOTIFY_API_ERROR",
			userMessage,
			httpStatus.value(),
			getRequestPath(request)
		);

		return ResponseEntity.status(httpStatus).body(errorResponse);
	}

	@ExceptionHandler(SpotifyTokenException.class)
	public ResponseEntity<SpotifyErrorResponse> handleSpotifyToken(
		SpotifyTokenException ex, WebRequest request) {
		log.warn("Spotify 토큰 오류 - 경로: {}", getRequestPath(request));

		SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
			"SPOTIFY_TOKEN_ERROR",
			"Spotify 인증에 문제가 발생했습니다. 계정을 다시 연결해 주세요.",
			HttpStatus.UNAUTHORIZED.value(),
			getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
	}

	@ExceptionHandler(SpotifyRateLimitException.class)
	public ResponseEntity<SpotifyErrorResponse> handleSpotifyRateLimit(
		SpotifyRateLimitException ex, WebRequest request) {
		log.warn("Spotify API 요청 한도 초과 - 재시도 대기시간: {}초, 경로: {}",
			ex.getRetryAfterSeconds(), getRequestPath(request));

		String message = String.format("요청이 너무 많습니다. %d초 후에 다시 시도해 주세요.",
			ex.getRetryAfterSeconds());

		SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
			"SPOTIFY_RATE_LIMIT",
			message,
			HttpStatus.TOO_MANY_REQUESTS.value(),
			getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
			.header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
			.body(errorResponse);
	}

	@ExceptionHandler(CryptoException.class)
	public ResponseEntity<SpotifyErrorResponse> handleCrypto(
		CryptoException ex, WebRequest request) {
		// 암호화 관련 상세 오류는 로그에만 남기고 일반적인 메시지 반환
		log.error("암호화 처리 오류 - 타입: {}, 경로: {}", ex.getErrorType().getDescription(), getRequestPath(request));

		String userMessage = switch (ex.getErrorType()) {
			case EMPTY_INPUT -> "필수 데이터가 누락되었습니다.";
			case INVALID_DATA -> "데이터 형식이 올바르지 않습니다.";
			case ENCRYPTION_FAILED, DECRYPTION_FAILED -> "보안 처리 중 오류가 발생했습니다.";
			default -> "일시적인 시스템 오류가 발생했습니다.";
		};

		SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
			"CRYPTO_ERROR",
			userMessage + " 잠시 후 다시 시도해 주세요.",
			HttpStatus.INTERNAL_SERVER_ERROR.value(),
			getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
	}

	@ExceptionHandler(StateStoreException.class)
	public ResponseEntity<SpotifyErrorResponse> handleStateStore(
		StateStoreException ex, WebRequest request) {
		log.error("상태 저장소 오류 - 타입: {}, 경로: {}", ex.getErrorType().getDescription(), getRequestPath(request));

		String userMessage = switch (ex.getErrorType()) {
			case INVALID_STATE, EXPIRED_STATE -> "인증 요청이 유효하지 않거나 만료되었습니다. 다시 시도해 주세요.";
			case EMPTY_INPUT -> "필수 인증 정보가 누락되었습니다.";
			case REDIS_CONNECTION_ERROR -> "일시적인 서비스 오류가 발생했습니다.";
			default -> "인증 처리 중 오류가 발생했습니다.";
		};

		HttpStatus status = switch (ex.getErrorType()) {
			case INVALID_STATE, EXPIRED_STATE, EMPTY_INPUT -> HttpStatus.BAD_REQUEST;
			default -> HttpStatus.INTERNAL_SERVER_ERROR;
		};

		SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
			"STATE_STORE_ERROR",
			userMessage + " 잠시 후 다시 시도해 주세요.",
			status.value(),
			getRequestPath(request)
		);

		return ResponseEntity.status(status).body(errorResponse);
	}

	@ExceptionHandler(SpotifyException.class)
	public ResponseEntity<SpotifyErrorResponse> handleGenericSpotify(
		SpotifyException ex, WebRequest request) {
		// 기타 Spotify 관련 예외는 상세 정보를 로그에만 남김
		log.error("Spotify 서비스 오류 - 경로: {}, 오류: {}", getRequestPath(request), ex.getMessage());

		SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
			"SPOTIFY_ERROR",
			"Spotify 서비스 이용 중 오류가 발생했습니다. 문제가 지속되면 고객지원팀에 문의해 주세요.",
			HttpStatus.INTERNAL_SERVER_ERROR.value(),
			getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<SpotifyErrorResponse> handleGeneral(
		Exception ex, WebRequest request) {
		// 예상치 못한 예외는 상세 정보를 숨김
		log.error("예상치 못한 오류 - 경로: {}, 타입: {}, 메시지: {}",
			getRequestPath(request), ex.getClass().getSimpleName(), ex.getMessage());

		SpotifyErrorResponse errorResponse = SpotifyErrorResponse.of(
			"INTERNAL_ERROR",
			"시스템 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
			HttpStatus.INTERNAL_SERVER_ERROR.value(),
			getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
	}

	// === Private Helper Methods ===

	private HttpStatus mapSpotifyStatusToHttp(int spotifyStatusCode) {
		return switch (spotifyStatusCode) {
			case 400 -> HttpStatus.BAD_REQUEST;
			case 401 -> HttpStatus.UNAUTHORIZED;
			case 403 -> HttpStatus.FORBIDDEN;
			case 404 -> HttpStatus.NOT_FOUND;
			case 429 -> HttpStatus.TOO_MANY_REQUESTS;
			case 500, 502, 503 -> HttpStatus.SERVICE_UNAVAILABLE;
			default -> HttpStatus.INTERNAL_SERVER_ERROR;
		};
	}

	private String getUserFriendlyMessage(int statusCode, String apiName) {
		String baseMessage = switch (statusCode) {
			case 400 -> "요청 내용을 확인해 주세요.";
			case 401 -> "Spotify 로그인이 필요합니다. 계정을 다시 연결해 주세요.";
			case 403 -> "Spotify 접근 권한이 없습니다. 계정 설정을 확인해 주세요.";
			case 404 -> "요청하신 정보를 찾을 수 없습니다.";
			case 429 -> "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
			case 500, 502, 503 -> "Spotify 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
			default -> "Spotify 서비스 이용 중 오류가 발생했습니다.";
		};

		// API 이름에 따른 맞춤 메시지 추가 (민감한 정보는 제외)
		if (apiName != null && !apiName.equals("Unknown")) {
			return switch (apiName.toLowerCase()) {
				case "player", "현재 재생 정보" -> "음악 재생 정보를 가져올 수 없습니다. " + baseMessage;
				case "playlist", "플레이리스트" -> "플레이리스트 정보를 가져올 수 없습니다. " + baseMessage;
				case "profile", "사용자 프로필" -> "프로필 정보를 가져올 수 없습니다. " + baseMessage;
				default -> baseMessage;
			};
		}

		return baseMessage;
	}

	private String getRequestPath(WebRequest request) {
		try {
			String description = request.getDescription(false);
			// "uri=/api/spotify/player" 형태에서 경로 추출
			if (description.startsWith("uri=")) {
				String path = description.substring(4);
				// 쿼리 파라미터나 민감한 정보 제거
				int queryIndex = path.indexOf('?');
				if (queryIndex > 0) {
					path = path.substring(0, queryIndex);
				}
				return path;
			}
			return "/unknown";
		} catch (Exception e) {
			log.debug("요청 경로 추출 실패: {}", e.getMessage());
			return "/unknown";
		}
	}

}
