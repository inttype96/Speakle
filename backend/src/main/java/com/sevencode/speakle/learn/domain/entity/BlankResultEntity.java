package com.sevencode.speakle.learn.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "blank_result")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlankResultEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "blank_result_id")
    private Long blankResultId;

    @Column(name = "blank_id")
    private Long blankId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "score")
    private Integer score;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "meta", columnDefinition = "jsonb")
    private Map<String, Object> meta;

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
}
