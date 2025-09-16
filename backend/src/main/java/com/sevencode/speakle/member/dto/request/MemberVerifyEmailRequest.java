package com.sevencode.speakle.member.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberVerifyEmailRequest {

	@NotBlank
	@Email
	private String email;

	@NotBlank
	@Size(min = 6, max = 6)
	private String code;

	public MemberVerifyEmailRequest(String email, String code) {
		this.email = email;
		this.code = code;
	}
}
