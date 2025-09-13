package com.sevencode.speakle.spotify.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "Spotify 사용자 프로필 정보")
@Getter
@NoArgsConstructor
public class SpotifyMe {

    @Schema(description = "Spotify 사용자 고유 ID", example = "smedjan")
    @JsonProperty("id")
    private String id;

    @Schema(description = "사용자가 설정한 표시 이름", example = "JM Wizzler")
    @JsonProperty("display_name")
    private String displayName;

    @Schema(description = "사용자 이메일 주소", example = "email@domain.com")
    @JsonProperty("email")
    private String email;

    @Schema(description = "사용자 거주 국가 코드", example = "KR")
    @JsonProperty("country")
    private String country;
}
