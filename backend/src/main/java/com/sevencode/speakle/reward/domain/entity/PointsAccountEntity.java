package com.sevencode.speakle.reward.domain.entity;

import com.sevencode.speakle.reward.domain.enums.PointLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "points_accounts")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointsAccountEntity {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "balance", nullable = false)
    private Integer balance = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false)
    private PointLevel level = PointLevel.BRONZE;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }
}
