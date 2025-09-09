package com.sevencode.speakle.social.spotify.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SpotifyConnectRequest {
	@NotBlank
	private String authorizationCode;
	private String redirectUri;  // FE가 넣어줄 수도, 생략 시 서버 기본 사용
	private String state;        // 권장: CSRF 방지용
}