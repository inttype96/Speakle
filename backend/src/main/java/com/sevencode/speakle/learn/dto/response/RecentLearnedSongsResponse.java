package com.sevencode.speakle.learn.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecentLearnedSongsResponse {
    private List<LearnedSongResponse> learnedSongs;
    private PaginationResponse pagination;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaginationResponse {
        private int currentPage;
        private int pageSize;
        private long totalItems;
        private int totalPages;
        private boolean hasPrevious;
        private boolean hasNext;
    }
}
