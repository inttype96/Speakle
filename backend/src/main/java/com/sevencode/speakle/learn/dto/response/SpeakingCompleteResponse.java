package com.sevencode.speakle.learn.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpeakingCompleteResponse {
    private Summary summary;
    private List<SpeakingResult> results;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private Integer totalQuestions;
        private Integer correctAnswers;
        private Integer totalScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpeakingResult {
        private Long speakingResultId;
        private Long userId;
        private Long speakingId;
        private Boolean isCorrect;
        private Integer score;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        private LocalDateTime createdAt;

        private SpeakingMeta meta;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpeakingMeta {
        private String score;
        private String recognized;
        private String originSentence;
    }
}