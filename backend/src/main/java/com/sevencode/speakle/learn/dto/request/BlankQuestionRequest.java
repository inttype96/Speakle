package com.sevencode.speakle.learn.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlankQuestionRequest {
    @NotNull(message = "learned_song_id는 필수입니다.")
    @Positive(message = "학습곡 ID는 양수여야 합니다.")
    private Long learnedSongId;

    private String situation;

    private String location;

    @NotNull(message = "song_id는 필수입니다.")
    private String songId;

    @NotNull(message = "문제 번호는 필수입니다.")
    @Min(value = 1, message = "문제 번호는 1 이상이어야 합니다.")
    @Max(value = 3, message = "문제 번호는 3 이하여야 합니다.")
    private Integer questionNumber;
}
