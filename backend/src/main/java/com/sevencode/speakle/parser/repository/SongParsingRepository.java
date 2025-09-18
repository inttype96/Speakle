package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sevencode.speakle.song.domain.Song;

import java.util.Optional;

public interface SongParsingRepository extends JpaRepository<Song, String> {

	// 1) songId로 row 존재 여부 확인
	boolean existsBySongId(String songId);

	// 2) songId로 lyrics만 가져오기 (대용량 컬럼 projection)
	@Query("select s.lyrics from Song s where s.songId = :songId")
	Optional<String> findLyricsBySongId(@Param("songId") String songId);

	// 보너스) 필요하면 전체 엔티티 조회
	Optional<Song> findBySongId(String songId);
}