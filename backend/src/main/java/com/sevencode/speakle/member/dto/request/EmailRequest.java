package com.sevencode.speakle.member.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class EmailRequest {

	@NotBlank
	@Email
	private String email;

	public EmailRequest(String email) {
		this.email = email;
	}
}
