package com.sevencode.speakle.song.domain;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "songs_lyrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LyricChunk {

    @Id
    private String songsLyricsId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "song_id", nullable = false)
    private Song song;

    private Long startTimeMs;

    @Column(columnDefinition = "TEXT")
    private String english;

    @Column(columnDefinition = "TEXT")
    private String korean;
}
