package com.sevencode.speakle.song.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LyricChunkResponse {
    private String id;
    private Long startTimeMs;
    private String english;
    private String korean;
}
