package com.sevencode.speakle.social.spotify.dto.response;

import java.time.OffsetDateTime;

public record SpotifyAccountInfoResponse(
	String provider,          // "SPOTIFY"
	String spotifyUserId,
	String scope,
	OffsetDateTime expiresAt
) {
}