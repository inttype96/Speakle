package com.sevencode.speakle.song.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "songs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Song {

    @Id
    private String songId;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String artists;

    private String album;

    private String albumImgUrl;

    @Enumerated(EnumType.STRING)
    private Level level;

    private Double danceability;
    private Double energy;
    private Short key;
    private Double loudness;
    private Short mode;
    private Double speechiness;
    private Double acousticness;
    private Double instrumentalness;
    private Double liveness;
    private Double valence;
    private Double tempo;

    private Long durationMs;

    @Column(columnDefinition = "TEXT")
    private String lyrics;

    private LocalDateTime createdAt;

    private Integer popularity;

    private Boolean isAdult;

    public enum Level {
        LOW, MEDIUM, HIGH
    }
}
