package com.sevencode.speakle.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshRequest(
	@NotBlank String refreshToken
) {
}