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
public class BlankQuestionResponse {
    private Long blankId;
    private Long learnedSongId;
    private Long songId;
    private Long recommendationSentenceId;
    private String originSentence;
    private String korean;
    private String question;
    private List<String> answer;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private LocalDateTime createdAt;
}
