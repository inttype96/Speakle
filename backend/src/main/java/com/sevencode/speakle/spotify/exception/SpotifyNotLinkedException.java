package com.sevencode.speakle.spotify.exception;

/**
 * Spotify 계정이 연결되지 않았을 때 발생하는 예외
 */
public class SpotifyNotLinkedException extends SpotifyException {

	private final String username;

	public SpotifyNotLinkedException(String username) {
		super(String.format("%s님의 Spotify 계정이 연결되지 않았습니다. 계정 설정에서 Spotify를 연결해 주세요.", username));
		this.username = username;
	}

	public String getUsername() {
		return username;
	}
}
