package com.sevencode.speakle.recommend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RandomSongResponse {
    private String songId;
    private String title;
    private String artist;
    private Integer popularity;
    private String difficulty;
    private String albumImageUrl;
}