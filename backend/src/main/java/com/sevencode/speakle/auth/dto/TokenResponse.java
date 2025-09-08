package com.sevencode.speakle.auth.dto;

public record TokenResponse(
	String tokenType,   // "Bearer"
	String accessToken,
	String refreshToken,
	long expiresIn    // seconds for access token
) {
}