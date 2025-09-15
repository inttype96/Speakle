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
public class DictationCompleteResponse {
    private Summary summary;
    private List<DictationResult> results;

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
    public static class DictationResult {
        private Long dictationResultId;
        private Long userId;
        private Long dictationId;
        private Boolean isCorrect;
        private Integer score;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        private LocalDateTime createdAt;
        private DictationMeta meta;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DictationMeta {
        private String userAnswer;
        private String correctAnswer;
    }
}
