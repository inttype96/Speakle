package com.sevencode.speakle.spotify.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "Spotify 연결 상태 응답")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SpotifyLinkStatusResponse {

    @Schema(description = "Spotify 계정 연결 여부", example = "true")
    private boolean connected;

    @Schema(description = "액세스 토큰 만료 시간 (Unix timestamp)", example = "1704067200", nullable = true)
    private Long expiresAtEpochSec;

    @Schema(description = "승인된 권한 범위",
            example = "user-read-private user-read-email user-read-playback-state user-modify-playback-state",
            nullable = true)
    private String scope;
}
