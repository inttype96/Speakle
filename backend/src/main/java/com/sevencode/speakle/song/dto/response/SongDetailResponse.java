package com.sevencode.speakle.song.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SongDetailResponse {
    private String songId;
    private String title;
    private String artists;
    private String album;
    private String albumImgUrl;
    private Integer popularity;
    private Long durationMs;
    private String lyrics;
    private List<LyricChunkResponse> lyricChunks;
}
