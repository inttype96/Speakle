package com.sevencode.speakle.learn.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "learned_song")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LearnedSongEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "learned_song_id")
    private Long learnedSongId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "song_id")
    private String songId;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "artists", columnDefinition = "text[]")
    private List<String> artists;

    @Column(name = "situation", columnDefinition = "TEXT")
    private String situation;

    @Column(name = "location", columnDefinition = "TEXT")
    private String location;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
