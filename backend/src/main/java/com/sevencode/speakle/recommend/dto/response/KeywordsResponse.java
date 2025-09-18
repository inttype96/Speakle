package com.sevencode.speakle.recommend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KeywordsResponse {
    private List<String> words;
    private List<String> phrases;
    private int top_k;  // FastAPI에 넘길 값
}