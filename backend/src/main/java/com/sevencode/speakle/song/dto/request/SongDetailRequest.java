package com.sevencode.speakle.song.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SongDetailRequest {
    private String situation;
    private String location;
}