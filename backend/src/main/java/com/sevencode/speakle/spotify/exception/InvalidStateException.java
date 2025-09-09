package com.sevencode.speakle.spotify.exception;

/**
 * Spotify 인증 상태가 유효하지 않을 때 발생하는 예외
 */
public class InvalidStateException extends SpotifyException {

    public InvalidStateException() {
        super("유효하지 않거나 만료된 인증 요청입니다. 다시 시도해 주세요.");
    }

    public InvalidStateException(String message) {
        super(message);
    }

	public InvalidStateException(String state, String reason) {
		super(String.format("Spotify 인증 상태가 유효하지 않습니다. (상태값: %s, 사유: %s) 새로고침 후 다시 시도해 주세요.", state, reason));
	}
}
