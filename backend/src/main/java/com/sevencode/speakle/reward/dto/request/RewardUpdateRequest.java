package com.sevencode.speakle.reward.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardUpdateRequest {
    @NotNull(message = "userId는 필수입니다.")
    private Long userId;

    @NotNull(message = "delta는 필수입니다.")
    private Integer delta;

    @NotNull(message = "source는 필수입니다.")
    private String source;

    private String refType;
    private Long refId;
}
