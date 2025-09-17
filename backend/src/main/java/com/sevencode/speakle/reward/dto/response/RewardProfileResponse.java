package com.sevencode.speakle.reward.dto.response;

import com.sevencode.speakle.reward.domain.enums.PointLevel;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardProfileResponse {
    private Long userId;
    private Integer balance;
    private PointLevel level;
}
