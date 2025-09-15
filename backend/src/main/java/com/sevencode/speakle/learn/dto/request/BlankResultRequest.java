package com.sevencode.speakle.learn.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlankResultRequest {
    @NotNull(message = "userId는 필수입니다.")
    private Long userId;

    @NotNull(message = "blankId는 필수입니다.")
    private Long blankId;

    @NotNull(message = "isCorrect는 필수입니다.")
    private Boolean isCorrect;

    @NotNull(message = "score는 필수입니다.")
    private Integer score;

    private String originSentence;

    private String question;

    private List<String> correctAnswer;

    private List<String> userAnswer;
}
