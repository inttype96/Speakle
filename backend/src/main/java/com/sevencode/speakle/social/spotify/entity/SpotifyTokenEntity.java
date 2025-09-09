package com.sevencode.speakle.social.spotify.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "spotify_tokens",
	indexes = {
		@Index(name = "idx_spotify_tokens_user", columnList = "user_id"),
		@Index(name = "idx_spotify_tokens_expires", columnList = "expires_at")
	})
public class SpotifyTokenEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)   // BIGSERIAL
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;                                   // 내부 회원 ID

	@Column(name = "provider", length = 20, nullable = false)
	private String provider;                               // "SPOTIFY"

	@Column(name = "spotify_user_id", length = 255)
	private String spotifyUserId;                          // Spotify 계정 식별자

	@Lob
	@Column(name = "access_token_enc", nullable = false)
	private String accessTokenEnc;                         // 암호화된 access token

	@Lob
	@Column(name = "refresh_token_enc", nullable = false)
	private String refreshTokenEnc;                        // 암호화된 refresh token

	@Column(name = "scope", length = 255)
	private String scope;                                  // 공백/콤마 구분

	@Column(name = "expires_at", nullable = false)
	private OffsetDateTime expiresAt;                      // access token 만료 시각

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null)
			createdAt = OffsetDateTime.now(ZoneOffset.UTC);
	}
}