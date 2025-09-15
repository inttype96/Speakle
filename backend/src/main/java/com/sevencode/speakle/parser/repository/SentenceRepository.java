package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.SentenceEntity;

import java.util.List;
import java.util.Optional;

public interface SentenceRepository extends JpaRepository<SentenceEntity, Long> {
	boolean existsByLearnedSongId(Long learnedSongId);

	List<SentenceEntity> findAllByLearnedSongId(Long learnedSongId);

	Optional<SentenceEntity> findByLearnedSongIdAndSentenceIgnoreCase(Long learnedSongId, String sentence);
}