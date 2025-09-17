package com.sevencode.speakle.song.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name = "learned_song")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnedSong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long learnedSongId;

    private Long userId;

    private String songId;

    @Column(columnDefinition = "TEXT")
    private String artists;

    private String situation;

    private String location;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = this.createdAt == null ? LocalDateTime.now() : this.createdAt;
    }
}

