package com.sevencode.speakle.song.repository;

import com.sevencode.speakle.song.domain.LyricChunk;
import com.sevencode.speakle.song.domain.Song;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LyricChunkRepository extends JpaRepository<LyricChunk, String> {
    List<LyricChunk> findBySong(Song song);

    List<LyricChunk> findBySongSongIdAndEnglishIsNotNullOrderByStartTimeMsAsc(String sondId);

    List<LyricChunk> findBySongSongIdOrderByStartTimeMsAsc(String songId);
}
