package com.sevencode.speakle.song.repository;

import com.sevencode.speakle.song.domain.Song;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SongRepository extends JpaRepository<Song, String> {
    Page<Song> findBySongIdIn(List<String> songIds, Pageable pageable);
}

