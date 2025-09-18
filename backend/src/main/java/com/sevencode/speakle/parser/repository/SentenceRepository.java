package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.SentenceEntity;

import java.util.List;
import java.util.Optional;

public interface SentenceRepository extends JpaRepository<SentenceEntity, Long> {
	boolean existsByLearnedSongId(String learnedSongId);

	List<SentenceEntity> findAllByLearnedSongId(String learnedSongId);

	Optional<SentenceEntity> findByLearnedSongIdAndSentenceIgnoreCase(String learnedSongId, String sentence);
}