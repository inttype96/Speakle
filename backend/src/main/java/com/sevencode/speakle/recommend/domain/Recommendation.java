package com.sevencode.speakle.recommend.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Recommendation {
    @JsonProperty("song_id")
    private String songId;

    @JsonProperty("chunk_idx")
    private int chunkIndex;

    private String words;
    private double score;
    private String source;
}

