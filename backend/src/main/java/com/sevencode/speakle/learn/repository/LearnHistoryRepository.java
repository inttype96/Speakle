package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LearnHistoryRepository extends JpaRepository<LearnedSongEntity, Long> {

    @Query("SELECT ls.songId, COUNT(ls) FROM LearnedSongEntity ls WHERE ls.songId IN :songIds GROUP BY ls.songId")
    List<Object[]> countBySongIdIn(@Param("songIds") List<String> songIds);
}