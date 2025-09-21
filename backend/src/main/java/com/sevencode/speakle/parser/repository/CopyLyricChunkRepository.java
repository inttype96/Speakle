package com.sevencode.speakle.parser.repository;

import com.sevencode.speakle.song.domain.LyricChunk;
import com.sevencode.speakle.song.domain.Song;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CopyLyricChunkRepository extends JpaRepository<LyricChunk, String> {
    List<LyricChunk> findBySong(Song song);

    // 가사 전문 재조합 용도
    List<LyricChunk> findAllBySong_SongIdOrderByStartTimeMsAsc(String songId);
}
