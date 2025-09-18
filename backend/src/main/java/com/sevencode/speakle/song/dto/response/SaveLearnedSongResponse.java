package com.sevencode.speakle.song.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveLearnedSongResponse {
    private Long learnedSongId;
    private String songId;
    private String situation;
    private String location;
}
