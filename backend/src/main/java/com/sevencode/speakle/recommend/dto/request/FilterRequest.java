package com.sevencode.speakle.recommend.dto.request;

import com.sevencode.speakle.song.domain.Song;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FilterRequest {
    private List<Song.Level> difficulties;  // 난이도 필터 (LOW, MEDIUM, HIGH)
    private SortType sortBy;  // 정렬 기준
    private SortOrder sortOrder;  // 정렬 방향
    private Integer page;
    private Integer size;

    public enum SortType {
        RECOMMEND_SCORE,  // 추천 점수순
        POPULARITY,       // 인기순
        LEARN_COUNT,      // 학습 조회순
        DURATION          // 곡 길이순
    }

    public enum SortOrder {
        ASC,
        DESC
    }

    // 기본값 설정
    public FilterRequest withDefaults() {
        if (this.sortBy == null) {
            this.sortBy = SortType.RECOMMEND_SCORE;
        }
        if (this.sortOrder == null) {
            this.sortOrder = SortOrder.DESC;
        }
        if (this.page == null) {
            this.page = 0;
        }
        if (this.size == null) {
            this.size = 20;
        }
        return this;
    }
}