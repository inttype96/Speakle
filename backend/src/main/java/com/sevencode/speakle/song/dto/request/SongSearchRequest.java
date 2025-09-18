package com.sevencode.speakle.song.dto.request;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SongSearchRequest {
    private Integer page = 0;
    private Integer size = 20;
    private List<String> sort; // ["popularity,desc", "title,asc"]

    // 검색 필터 (추후 확장 가능)
    private String keyword;
    private String level;
    private Integer minPopularity;
    private Integer maxPopularity;
}