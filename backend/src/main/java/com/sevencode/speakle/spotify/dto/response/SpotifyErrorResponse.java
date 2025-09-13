package com.sevencode.speakle.spotify.dto.response;

import java.time.Instant;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "Spotify API 에러 응답")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SpotifyErrorResponse {

    @Schema(description = "에러 코드", example = "SPOTIFY_NOT_LINKED")
    private String errorCode;

    @Schema(description = "에러 메시지", example = "Spotify 계정이 연결되어 있지 않습니다. 먼저 Spotify 계정을 연결해 주세요.")
    private String message;

    @Schema(description = "HTTP 상태 코드", example = "404")
    private int statusCode;

    @Schema(description = "에러 발생 시각", example = "2024-01-01T10:00:00Z")
    private Instant timestamp;

    @Schema(description = "요청 경로", example = "/api/spotify/player")
    private String path;

    public static SpotifyErrorResponse of(String errorCode, String message, int statusCode, String path) {
        return new SpotifyErrorResponse(errorCode, message, statusCode, Instant.now(), path);
    }
}
