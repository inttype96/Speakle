package com.sevencode.speakle.learn.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpeakingQuestionResponse {
    private Long speakingId;
    private Long learnedSongId;
    private String songId;
    private String coreSentence;
}
