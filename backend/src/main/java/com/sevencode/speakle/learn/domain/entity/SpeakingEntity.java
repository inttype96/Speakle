package com.sevencode.speakle.learn.domain.entity;

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
@Table(name = "speaking")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpeakingEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "speaking_id")
    private Long speakingId;

    @Column(name = "learned_song_id", nullable = false)
    private Long learnedSongId;

    @Column(name = "situation", length = 255)
    private String situation;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "song_id", nullable = false)
    private Long songId;

    @Column(name = "origin_sentence", columnDefinition = "TEXT", nullable = false)
    private String originSentence;

    @Column(name = "answer", columnDefinition = "TEXT")
    private String answer;

    @Enumerated(EnumType.STRING)
    @Column(name = "level")
    private Level level;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "meta", columnDefinition = "jsonb")
    private Map<String, Object> meta;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum Level { BEGINNER, INTERMEDIATE, ADVANCED }

}
