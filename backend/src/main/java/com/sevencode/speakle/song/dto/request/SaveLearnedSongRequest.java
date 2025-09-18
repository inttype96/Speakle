package com.sevencode.speakle.song.dto.request;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaveLearnedSongRequest {
    private String songId;
    private String situation;
    private String location;
}
