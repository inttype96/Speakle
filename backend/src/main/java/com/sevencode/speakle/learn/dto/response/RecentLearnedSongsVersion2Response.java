package com.sevencode.speakle.learn.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecentLearnedSongsVersion2Response {
    private List<LearnedSongVersion2Response> learnedSongs;
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
