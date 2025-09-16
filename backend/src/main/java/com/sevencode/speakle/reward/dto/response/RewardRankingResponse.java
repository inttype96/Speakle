package com.sevencode.speakle.reward.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardRankingResponse {
    private Integer rank;
    private Long userId;
    private String username;
    private String profileImageUrl;
    private Integer points;
}
