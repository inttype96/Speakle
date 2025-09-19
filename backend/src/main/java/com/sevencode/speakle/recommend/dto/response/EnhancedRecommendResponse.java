package com.sevencode.speakle.recommend.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnhancedRecommendResponse {
    private List<SongMetaResponse> recommendedSongs;
    private String situation;
    private String location;
    private KeywordsResponse keywords;
    private Integer totalCount;
}