package com.sevencode.speakle.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * refresh_tokens 테이블 매핑 (원문 저장 버전)
 *  id           BIGSERIAL (PK)
 *  user_id      BIGINT
 *  refresh_token TEXT
 *  refresh_exp  TIMESTAMPTZ
 *  created_at   TIMESTAMPTZ
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "refresh_tokens", indexes = {
	@Index(name = "idx_rt_user_id", columnList = "user_id"),
	@Index(name = "idx_rt_refresh_exp", columnList = "refresh_exp")
})
public class RefreshTokenEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY) // BIGSERIAL
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Lob
	@Column(name = "refresh_token", nullable = false)
	private String refreshToken;              // 원문 저장(주의)

	@Column(name = "refresh_exp", nullable = false)
	private OffsetDateTime refreshExp;

	@Column(name = "created_at", nullable = false)
	private OffsetDateTime createdAt;

	@PrePersist
	protected void onCreate() {
		if (createdAt == null)
			createdAt = OffsetDateTime.now(ZoneOffset.UTC);
	}

	public static RefreshTokenEntity of(Long userId, String token, OffsetDateTime exp) {
		RefreshTokenEntity e = new RefreshTokenEntity();
		e.setUserId(userId);
		e.setRefreshToken(token);
		e.setRefreshExp(exp);
		return e;
	}
}
