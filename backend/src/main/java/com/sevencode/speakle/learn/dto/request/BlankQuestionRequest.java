package com.sevencode.speakle.learn.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlankQuestionRequest {
    @NotNull(message = "learned_song_id는 필수입니다.")
    @JsonProperty("learned_song_id")
    private Long learnedSongId;

    private String situation;

    private String location;

    @NotNull(message = "song_id는 필수입니다.")
    @JsonProperty("song_id")
    private Long songId;

    @Min(value = 1, message = "questionNumber는 1 이상이어야 합니다.")
    private Integer questionNumber;
}
