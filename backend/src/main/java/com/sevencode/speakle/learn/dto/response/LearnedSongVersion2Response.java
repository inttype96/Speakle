package com.sevencode.speakle.learn.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnedSongVersion2Response {
    private Long learnedSongId;
    private Long userId;
    private String songId;
    private String location;
    private String situation;
    private String artists;
    private String title;
    private String album;
    private String albumImgUrl;
    private String level;
    private Double danceability;
    private Double energy;
    private Integer key;
    private Double loudness;
    private Integer mode;
    private Double speechiness;
    private Double acousticness;
    private Double instrumentalness;
    private Double liveness;
    private Double valence;
    private Double tempo;
    private Double durationMs;
    private String lyrics;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private LocalDateTime createdAt;
}
