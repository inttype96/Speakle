package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.WordEntity;

import java.util.List;
import java.util.Optional;

public interface WordRepository extends JpaRepository<WordEntity, Long> {
	boolean existsByLearnedSongId(Long learnedSongId);

	List<WordEntity> findAllByLearnedSongId(Long learnedSongId);

	Optional<WordEntity> findByLearnedSongIdAndWordIgnoreCase(Long learnedSongId, String word);
}