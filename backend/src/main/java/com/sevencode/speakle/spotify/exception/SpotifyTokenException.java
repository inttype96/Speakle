package com.sevencode.speakle.spotify.exception;

/**
 * Spotify 토큰 관련 예외
 */
public class SpotifyTokenException extends RuntimeException {
	public SpotifyTokenException() {
		super("Spotify 인증 토큰에 문제가 발생했습니다. 다시 로그인해 주세요.");
	}

	public SpotifyTokenException(String message) {
		super(message);
	}

	public SpotifyTokenException(String tokenType, String reason) {
		super(String.format("Spotify %s 토큰 오류: %s 계정을 다시 연결해 주세요.", tokenType, reason));
	}
}
