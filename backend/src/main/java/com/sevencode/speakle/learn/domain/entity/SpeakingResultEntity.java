package com.sevencode.speakle.learn.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "speaking_result")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpeakingResultEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "speaking_result_id")
    private Long speakingResultId;

    @Column(name = "speaking_id", nullable = false)
    private Long speakingId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @Column(nullable = false)
    private Integer score;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "meta", columnDefinition = "jsonb")
    private Map<String, Object> meta;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PreUpdate
    protected void onUpdate() {
        createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    /**
     * 안전한 메타 데이터 접근자
     */
    public String getMetaValue(String key) {
        if (meta == null || key == null) {
            return null;
        }
        Object value = meta.get(key);
        return value != null ? value.toString() : null;
    }
}