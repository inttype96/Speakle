package com.sevencode.speakle.recommend.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HybridRecommendRequest {
    private String situation;
    private String location;
    private int limit;
}
