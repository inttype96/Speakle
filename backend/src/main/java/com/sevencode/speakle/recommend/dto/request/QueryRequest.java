package com.sevencode.speakle.recommend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class QueryRequest {
    private List<String> words;
    private List<String> phrases;

    @JsonProperty("top_k")
    private int topK;
}

