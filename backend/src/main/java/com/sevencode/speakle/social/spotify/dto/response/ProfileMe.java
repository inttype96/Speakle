package com.sevencode.speakle.social.spotify.dto.response;

/** GET /v1/me 응답(필요 필드만) */
public record ProfileMe(
	String id,
	String display_name,
	String email
) {
}