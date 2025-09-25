package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.dto.response.LearnedSongInfoResponse;
import com.sevencode.speakle.learn.dto.response.RecentLearnedSongsResponse;
import com.sevencode.speakle.learn.dto.response.RecentLearnedSongsVersion2Response;

public interface LearnedSongService {
    RecentLearnedSongsResponse getRecentLearnedSongs(Long userId, int page, int size);

    LearnedSongInfoResponse getSituationAndLocation(Long learnedSongId);

//    RecentLearnedSongsVersion2Response getRecentLearnedSongsVersion2(Long userId, int page, int size);
}
