package com.sevencode.speakle.spotify.exception;

import lombok.Getter;

/**
 * Spotify API 요청 한도 초과 시 발생하는 예외
 */
@Getter
public class SpotifyRateLimitException extends RuntimeException {
	private final int retryAfterSeconds;

	public SpotifyRateLimitException(int retryAfterSeconds) {
		super(String.format("Spotify API 요청 한도를 초과했습니다. %d초 후에 다시 시도해 주세요.", retryAfterSeconds));
		this.retryAfterSeconds = retryAfterSeconds;
	}

	public SpotifyRateLimitException() {
		super("Spotify API 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
		this.retryAfterSeconds = 60; // 기본값 1분
	}

}
