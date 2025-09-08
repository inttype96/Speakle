package com.sevencode.speakle.member.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberChangePasswordRequest {
	@NotBlank
	private String newPasswordHash;
}
