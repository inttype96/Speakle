package com.sevencode.speakle.reward.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;


import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "points_ledger")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointsLedgerEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "points_ledger_id")
    private Long pointsLedgerId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @CreationTimestamp
    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false)
    private SourceType source;

    @Column(name = "delta", nullable = false)
    private Integer delta;

    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type")
    private RefType refType;

    @Column(name = "ref_id")
    private Long refId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "meta", columnDefinition = "jsonb")
    private Map<String, Object> meta;

    @PrePersist
    public void prePersist() {
        if (occurredAt == null) {
            occurredAt = LocalDateTime.now();
        }
    }

    public enum SourceType {
        BLANK, DICTATION, SPEAKING, ATTENDANCE
    }

    public enum RefType {
        BLANK_RESULT, DICTATION_RESULT, SPEAKING_RESULT, ATTENDANCE_DAYS
    }
}
