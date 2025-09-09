package com.sevencode.speakle.spotify.exception;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Spotify 관련 모든 예외의 기본 클래스
 */
@Schema(description = "Spotify 관련 예외")
public class SpotifyException extends RuntimeException {

    public SpotifyException(String message) {
        super(message);
    }

    public SpotifyException(String message, Throwable cause) {
        super(message, cause);
    }
}
