package com.sevencode.speakle.learn.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SpeakingEvaluationRequest {

    @NotNull(message = "스피킹 문제 ID는 필수입니다.")
    private Long speakingId;

    @NotBlank(message = "스크립트는 필수입니다.")
    private String script;

    @NotBlank(message = "오디오 데이터는 필수입니다.")
    private String audio;       // Base64 인코딩된 오디오 데이터
}