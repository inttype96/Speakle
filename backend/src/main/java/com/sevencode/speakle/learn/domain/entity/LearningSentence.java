package com.sevencode.speakle.learn.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "learning_sentence")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningSentence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "learning_sentence_id")
    private Long learningSentenceId;

    @Column(name = "learned_song_id")
    private Long learnedSongId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "core_sentence", columnDefinition = "TEXT", nullable = false)
    private String coreSentence;

    @Column(name = "korean", columnDefinition = "TEXT")
    private String korean;

    @Column(name = "sentence_order", nullable = false)
    private Long order;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}