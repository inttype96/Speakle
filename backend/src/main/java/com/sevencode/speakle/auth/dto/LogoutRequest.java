/** 주석-미작성-작성자:kang*/
package com.sevencode.speakle.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LogoutRequest(
	@NotBlank(message = "refreshToken은 필수입니다.")
	String refreshToken
) {
}