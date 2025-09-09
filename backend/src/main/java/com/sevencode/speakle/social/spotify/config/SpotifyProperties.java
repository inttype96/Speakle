package com.sevencode.speakle.social.spotify.config;

import lombok.Data;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "spotify")
public class SpotifyProperties {
	private String clientId;
	private String clientSecret;
	private String redirectUri;

	/** authorize 요청 시 필요한 scope (공백 구분) */
	private String scopes;

	/** 콜백 후 FE로 redirect 시킬 URL */
	private String postLoginRedirect;
}