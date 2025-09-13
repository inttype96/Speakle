package com.sevencode.speakle.spotify.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class SpotifyWebClientConfig {

	@Bean(name = "spotifyAccountsWebClient")
	public WebClient spotifyAccountsWebClient() {
		return WebClient.builder()
			.baseUrl("https://accounts.spotify.com")
			.build();
	}

	@Bean(name = "spotifyApiWebClient")
	public WebClient spotifyApiWebClient() {
		return WebClient.builder()
			.baseUrl("https://api.spotify.com")
			.build();
	}
}
