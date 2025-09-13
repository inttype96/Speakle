/** 주석-미작성-작성자:kang*/
package com.sevencode.speakle.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
	@NotBlank @Email String email,
	@NotBlank String password
) {
}