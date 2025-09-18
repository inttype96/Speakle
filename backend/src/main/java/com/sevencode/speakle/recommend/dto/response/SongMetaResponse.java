package com.sevencode.speakle.recommend.dto.response;

import com.sevencode.speakle.song.domain.Song;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SongMetaResponse {
    private String songId;
    private String title;
    private String artists;
    private String albumName;
    private String albumImgUrl;
    private Song.Level difficulty;
    private Long durationMs;
    private Integer popularity;
    private Double recommendScore;
    private Integer learnCount;  // 학습 조회수

    public static SongMetaResponse from(Song song, Double recommendScore, Integer learnCount) {
        return SongMetaResponse.builder()
                .songId(song.getSongId())
                .title(song.getTitle())
                .artists(song.getArtists())
                .albumName(song.getAlbum())
                .albumImgUrl(song.getAlbumImgUrl())
                .difficulty(song.getLevel())
                .durationMs(song.getDurationMs())
                .popularity(song.getPopularity())
                .recommendScore(recommendScore)
                .learnCount(learnCount)
                .build();
    }
}