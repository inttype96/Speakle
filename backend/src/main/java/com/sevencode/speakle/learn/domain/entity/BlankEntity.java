package com.sevencode.speakle.learn.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "blank")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlankEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "blank_id")
    private Long blankId;

    @Column(name = "learned_song_id")
    private Long learnedSongId;

    @Column(name = "situation")
    private String situation;

    @Column(name = "location")
    private String location;

    @Column(name = "song_id")
    private Long songId;

    @Column(name = "origin_sentence", columnDefinition = "TEXT")
    private String originSentence;

    @Column(name = "korean", columnDefinition = "TEXT")
    private String korean;

    @Column(name = "question", columnDefinition = "TEXT")
    private String question;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "answer", columnDefinition = "text[]")
    private List<String> answer;

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
