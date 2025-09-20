package com.sevencode.speakle.learn.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SpeakingQuestionRequest {
    @NotNull(message = "학습 곡 ID는 필수입니다.")
    private Long learnedSongId;

    private String situation;

    private String location;

    @NotNull(message = "song_id는 필수입니다.")
    private String songId;

    @NotNull(message = "문제 번호는 필수입니다.")
    @Min(value = 1, message = "문제 번호는 1 이상이어야 합니다.")
    private Integer questionNumber;
}
