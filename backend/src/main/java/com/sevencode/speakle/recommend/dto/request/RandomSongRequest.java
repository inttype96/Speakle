package com.sevencode.speakle.recommend.dto.request;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RandomSongRequest {
    private String userId;
    private AudioFeatures userPlaylistFeatures;
    private WeatherData weatherData;
    private Integer minPopularity;
    private List<String> difficultyLevels;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AudioFeatures {
        private Double acousticness;
        private Double energy;
        private Double loudness;
        private Double valence;
        private Double tempo;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeatherData {
        private String condition;
        private String description;
        private Double temperature;
    }
}
