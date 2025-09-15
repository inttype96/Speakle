package com.sevencode.speakle.learn.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DictationQuestionRequest {
    private Long learnedSongId;
    private Integer questionNumber;
}
