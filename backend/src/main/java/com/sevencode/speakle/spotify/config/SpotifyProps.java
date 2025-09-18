package com.sevencode.speakle.spotify.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Component
@ConfigurationProperties(prefix = "spotify")
@Getter
@Setter
public class SpotifyProps {

	private String clientId;
	private String clientSecret;
	private String redirectUri;

	// 플레이리스트 생성/수정에 필요한 권한들을 명시적으로 포함
	private String scopes = String.join(" ",
		// 사용자 기본 정보
		"user-read-private",
		"user-read-email",

		// 플레이어 제어
		"user-read-playback-state",
		"user-modify-playback-state",
		"user-read-currently-playing",

		// 플레이리스트 권한
		"playlist-read-private",          // 비공개 플레이리스트 읽기
		"playlist-read-collaborative",    // 협업 플레이리스트 읽기
		"playlist-modify-public",         // 공개 플레이리스트 생성/수정
		"playlist-modify-private",        // 비공개 플레이리스트 생성/수정

		// 라이브러리 및 기타
		"user-library-read",
		"user-library-modify",           // 라이브러리 수정 (선택사항)
		"user-top-read",
		"user-read-recently-played",

		// 팔로우 관련 (플레이리스트 언팔로우용)
		"playlist-modify-public",         // 이미 위에 있지만 명시
		"playlist-modify-private"         // 이미 위에 있지만 명시
	);
}
