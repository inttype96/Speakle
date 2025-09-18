package com.sevencode.speakle.learn.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DictationQuestionResponse {
    private Long dictationId;
    private Integer questionNumber;
    private Long learnedSongId;
    private String songId;
    private String title;
    private String[] artists;
    private String coreSentence;
    private Long startTime;
    private Long duration;
    private Long endTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private LocalDateTime createdAt;
}
