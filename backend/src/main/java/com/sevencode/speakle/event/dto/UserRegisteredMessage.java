package com.sevencode.speakle.event.dto;

import java.time.Instant;
import io.swagger.v3.oas.annotations.media.Schema;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 사용자 가입 이벤트 DTO (v=1)
 */
@Schema(description = "사용자 가입 이벤트")
public record UserRegisteredMessage(
	@Schema(description = "가입 사용자 ID", example = "999") Long userId,
	@Schema(description = "이메일", example = "test@example.com") String email,
	@Schema(description = "사용자명", example = "testuser") String username,
	@Schema(description = "가입 시각(UTC)", example = "2025-09-18T02:30:00.607315Z") Instant registeredAt,
	@Schema(description = "이벤트 스키마 버전", example = "1") int v
) {
	@JsonCreator
	public UserRegisteredMessage(
		@JsonProperty("userId") Long userId,
		@JsonProperty("email") String email,
		@JsonProperty("username") String username,
		@JsonProperty("registeredAt") Instant registeredAt,
		@JsonProperty("v") Integer v
	) {
		this(userId, email, username, registeredAt, v != null ? v : 1);
	}
}
