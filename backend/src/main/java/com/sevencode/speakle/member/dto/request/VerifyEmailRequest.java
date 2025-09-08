package com.sevencode.speakle.member.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Getter
@NoArgsConstructor
public class VerifyEmailRequest {
	@NotNull
	private Long userId;
	@NotBlank
	private String token;
}