package com.sevencode.speakle.learn.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "dictation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DictationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dictation_id")
    private Long dictationId;

    @Column(name = "learned_song_id")
    private Long learnedSongId;

    @Column(name = "situation")
    private String situation;

    @Column(name = "location")
    private String location;

    @Column(name = "song_id")
    private String songId;

    @Column(name = "media_url")
    private String mediaUrl;

    @Column(name = "start_time")
    private Long startTime;

    @Column(name = "end_time")
    private Long endTime;

    @Column(name = "origin_sentence")
    private String originSentence;

    @Column(name = "korean")
    private String korean;

    @Column(name = "answer")
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

    @Column(name = "question_number")
    private Integer questionNumber;

    public enum Level { BEGINNER, INTERMEDIATE, ADVANCED }
}
