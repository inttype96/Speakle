package com.sevencode.speakle.song.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SongRecommendationReasonResponse {
    private String songId;
    private String reasonSentence;
    private String message;
}