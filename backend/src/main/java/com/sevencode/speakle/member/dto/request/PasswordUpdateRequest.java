package com.sevencode.speakle.member.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PasswordUpdateRequest {

	@NotBlank
	private String currentPassword;

	@NotBlank
	@Size(min = 8, message = "비밀번호는 최소 8자리 이상이어야 합니다.")
	private String newPassword;

	public PasswordUpdateRequest(String currentPassword, String newPassword) {
		this.currentPassword = currentPassword;
		this.newPassword = newPassword;
	}
}
