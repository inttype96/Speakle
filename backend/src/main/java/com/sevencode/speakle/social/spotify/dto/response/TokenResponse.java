package com.sevencode.speakle.social.spotify.dto.response;

/** /api/token 응답 */
public record TokenResponse(
	String access_token,
	String token_type,
	Integer expires_in,
	String refresh_token,
	String scope
) {
}
