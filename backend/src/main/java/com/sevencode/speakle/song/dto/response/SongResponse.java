package com.sevencode.speakle.song.dto.response;

import com.sevencode.speakle.song.domain.Song;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SongResponse {
    private String songId;
    private String title;
    private String artists;
    private String albumImgUrl;
    private Integer popularity;
    private Song.Level level;
}