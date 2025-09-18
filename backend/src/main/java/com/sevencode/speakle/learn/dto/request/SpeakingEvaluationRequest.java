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

    /**
     * Base64 오디오 데이터의 유효성을 추가 검증
     */
    public boolean isValidAudioData() {
        if (audio == null || audio.trim().isEmpty()) {
            return false;
        }

        // Base64 패딩 검증
        int padding = audio.length() % 4;
        if (padding != 0) {
            return false;
        }
        return true;
    }
}