package com.sevencode.speakle.recommend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recommendation_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String query;

    @ElementCollection
    @CollectionTable(
            name = "recommendation_log_candidate_ids",
            joinColumns = @JoinColumn(name = "recommendation_log_id")
    )
    @Column(name = "song_id")
    @Builder.Default
    private List<String> candidateSongIds = new ArrayList<>();

    private String algoVersion;

    @Column(columnDefinition = "jsonb")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private String meta;

    private LocalDateTime createdAt;


    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
