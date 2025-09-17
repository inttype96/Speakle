package com.sevencode.speakle.recommend.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecommendResponse {
    private List<String> candidateSongIds; // 추천곡 ID 리스트
    private KeywordsResponse keywords;          // LLM이 생성한 단어·표현
}
