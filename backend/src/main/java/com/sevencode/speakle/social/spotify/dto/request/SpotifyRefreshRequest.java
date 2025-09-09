package com.sevencode.speakle.social.spotify.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SpotifyRefreshRequest(
	@NotBlank String refreshTokenEnc   // 저장된 암호문을 그대로 쓰는 정책 or 서버에서 복호화
) {
}