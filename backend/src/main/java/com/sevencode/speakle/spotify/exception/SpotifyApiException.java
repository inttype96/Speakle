package com.sevencode.speakle.spotify.exception;

import lombok.Getter;

/**
 * Spotify API 호출 시 발생하는 예외
 */
@Getter
public class SpotifyApiException extends SpotifyException {

	private final int statusCode;
	private final String apiName;

	public SpotifyApiException(String apiName, int statusCode) {
		super(String.format("Spotify %s API 호출에 실패했습니다. %s (상태코드: %d)",
			apiName, getDetailedMessage(statusCode), statusCode));
		this.statusCode = statusCode;
		this.apiName = apiName;
	}

	public SpotifyApiException(String message, int statusCode, Throwable cause) {
		super(message, cause);
		this.statusCode = statusCode;
		this.apiName = "Unknown";
	}

	public SpotifyApiException(int statusCode) {
		super(getDefaultMessage(statusCode));
		this.statusCode = statusCode;
		this.apiName = "Unknown";
	}

	/**
	 * HTTP 상태 코드별 기본 메시지 반환
	 */
	private static String getDefaultMessage(int statusCode) {
		return switch (statusCode) {
			case 400 -> "요청 데이터가 올바르지 않습니다. 입력 내용을 확인해 주세요.";
			case 401 -> "Spotify 인증이 만료되었습니다. 다시 로그인해 주세요.";
			case 403 -> "Spotify API 접근 권한이 없습니다. 계정 연결 상태를 확인해 주세요.";
			case 404 -> "요청하신 Spotify 리소스(음악, 플레이리스트 등)를 찾을 수 없습니다.";
			case 429 -> "Spotify API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.";
			case 500 -> "Spotify 서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
			case 502 -> "Spotify 서버와의 연결에 문제가 발생했습니다. 네트워크 상태를 확인해 주세요.";
			case 503 -> "Spotify 서비스가 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.";
			default -> String.format("Spotify 서비스 이용 중 오류가 발생했습니다. (오류코드: %d) 문제가 지속되면 고객지원팀에 문의해 주세요.", statusCode);
		};
	}

	/**
	 * 상태 코드별 상세 설명 메시지
	 */
	private static String getDetailedMessage(int statusCode) {
		return switch (statusCode) {
			case 400 -> "요청 형식을 확인해 주세요.";
			case 401 -> "로그인이 필요합니다.";
			case 403 -> "권한이 부족합니다.";
			case 404 -> "리소스를 찾을 수 없습니다.";
			case 429 -> "요청이 너무 많습니다.";
			case 500, 502, 503 -> "서버 오류입니다.";
			default -> "알 수 없는 오류입니다.";
		};
	}
}
