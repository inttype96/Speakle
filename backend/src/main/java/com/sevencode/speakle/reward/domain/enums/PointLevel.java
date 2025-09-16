package com.sevencode.speakle.reward.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PointLevel {
    BRONZE("bronze", 0, 49),
    SILVER("silver", 50, 99),
    GOLD("gold", 100, 199),
    PLATINUM("platinum", 200, Integer.MAX_VALUE);

    private final String displayName;
    private final int minPoints;
    private final int maxPoints;

    public static PointLevel fromPoints(int points) {
        for (PointLevel level : values()) {
            if (points >= level.minPoints && points <= level.maxPoints) {
                return level;
            }
        }
        return BRONZE;
    }
}
