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
public class BlankCompleteResponse {
    private Summary summary;
    private List<BlankResult> results;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Summary {
        private int totalQuestions;
        private int correctAnswers;
        private int totalScore;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BlankResult {
        private Long blankResultId;
        private Long userId;
        private Long blankId;
        private Boolean isCorrect;
        private Integer score;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        private LocalDateTime createdAt;

        private BlankMeta meta;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BlankMeta {
        private String originSentence;
        private String question;
        private List<String> correctAnswer;
        private List<String> userAnswer;
    }
}
