package com.sevencode.speakle.spotify.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Component
@ConfigurationProperties(prefix = "spotify.oauth")
@Getter
@Setter
public class SpotifyProps {

	private String clientId;
	private String clientSecret;
	private String redirectUri;
	private String scopes = "user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative user-library-read";
}
