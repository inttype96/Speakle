/** 주석-미작성-작성자:kang*/
package com.sevencode.speakle.auth.dto;

public record TokenResponse(
	String tokenType,
	String accessToken,
	String refreshToken,
	long expiresIn    // seconds for access token
) {
}