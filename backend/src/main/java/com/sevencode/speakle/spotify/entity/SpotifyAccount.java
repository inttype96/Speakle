package com.sevencode.speakle.spotify.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "spotify_tokens")
@Getter
@Setter
@NoArgsConstructor
public class SpotifyAccount {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "provider", nullable = false, length = 20)
	private String provider;

	@Column(name = "spotify_user_id", nullable = false, length = 255)
	private String spotifyUserId;

	@Column(name = "access_token_enc", nullable = false, columnDefinition = "TEXT")
	private String accessTokenEnc;

	@Column(name = "refresh_token_enc", nullable = false, columnDefinition = "TEXT")
	private String refreshTokenEnc;

	@Column(name = "scope", length = 255)
	private String scope;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) createdAt = Instant.now();
	}

	@Transient
	public Long getExpiresAtEpochSec() {
		return (expiresAt != null) ? expiresAt.getEpochSecond() : null;
	}

}
