package com.sevencode.speakle.learn.dto.response;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpeakingEvaluationResponse {
    private Long speakingResultId;
    private Long speakingId;
    private Boolean isCorrect;
    private Integer score;
    private String createdAt;
    private Map<String, Object> meta;
}