package com.sevencode.speakle.learn.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlankResultRequest {
    @NotNull(message = "userId는 필수입니다.")
    @Positive(message = "빈칸 ID는 양수여야 합니다.")
    private Long userId;

    @NotNull(message = "blankId는 필수입니다.")
    private Long blankId;

    @NotNull(message = "isCorrect는 필수입니다.")
    @NotNull(message = "정답 여부는 필수입니다.")
    private Boolean isCorrect;

    @NotNull(message = "score는 필수입니다.")
    @Min(value = 0, message = "점수는 0 이상이어야 합니다.")
    @Max(value = 5, message = "점수는 5 이하여야 합니다.")
    private Integer score;

    @NotBlank(message = "원본 문장은 필수입니다.")
    private String originSentence;

    @NotBlank(message = "문제는 필수입니다.")
    private String question;

    private List<String> correctAnswer;

    private List<String> userAnswer;
}
