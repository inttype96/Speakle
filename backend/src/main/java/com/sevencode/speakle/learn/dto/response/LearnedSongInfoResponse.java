package com.sevencode.speakle.learn.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnedSongInfoResponse {
    private String situation;
    private String location;
}
