package com.sevencode.speakle.learn.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DictationEvaluationRequest {

    @NotNull(message = "사용자 ID는 필수입니다.")
    private Long userId;

    @NotNull(message = "딕테이션 ID는 필수입니다.")
    private Long dictationId;

    @NotNull(message = "정답 여부는 필수입니다.")
    private Boolean isCorrect;

    @NotNull(message = "점수는 필수입니다.")
    private Integer score;

    private Map<String, Object> meta;
}
