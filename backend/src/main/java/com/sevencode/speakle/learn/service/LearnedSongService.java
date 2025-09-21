package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.dto.response.RecentLearnedSongsResponse;

public interface LearnedSongService {
    RecentLearnedSongsResponse getRecentLearnedSongs(Long userId, int page, int size);
}
