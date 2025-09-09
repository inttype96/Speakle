package com.sevencode.speakle.social.spotify.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

	@Bean
	public WebClient spotifyAuthClient(WebClient.Builder builder) {
		return builder.baseUrl("https://accounts.spotify.com").build();
	}

	@Bean
	public WebClient spotifyApiClient(WebClient.Builder builder) {
		return builder.baseUrl("https://api.spotify.com/v1").build();
	}
}
