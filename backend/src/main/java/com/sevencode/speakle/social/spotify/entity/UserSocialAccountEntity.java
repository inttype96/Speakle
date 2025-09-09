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
@Table(name = "user_social_accounts",
	uniqueConstraints = {
		// 한 user_id 당 provider 1개만 연결되도록
		@UniqueConstraint(name = "uq_user_provider", columnNames = {"user_id", "provider"})
	},
	indexes = {
		@Index(name = "idx_social_user", columnList = "user_id")
	})
public class UserSocialAccountEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)  // BIGSERIAL
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "provider", length = 20, nullable = false)
	private String provider;                              // "SPOTIFY"

	@Column(name = "provider_user_id", length = 120)
	private String providerUserId;                        // Spotify user id

	@Column(name = "linked_at", nullable = false)
	private OffsetDateTime linkedAt;

	@PrePersist
	void onCreate() {
		if (linkedAt == null)
			linkedAt = OffsetDateTime.now(ZoneOffset.UTC);
	}
}