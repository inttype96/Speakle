package com.sevencode.speakle.reward.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.sevencode.speakle.reward.domain.enums.PointLevel;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardUpdateResponse {
    private Long userId;
    private Integer balance;
    private PointLevel level;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private LocalDateTime updatedAt;
}
