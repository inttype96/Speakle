package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.WordEntity;

import java.util.List;
import java.util.Optional;

public interface WordRepository extends JpaRepository<WordEntity, Long> {
	boolean existsByLearnedSongId(String learnedSongId);

	boolean existsByLearnedSongIdAndSituationAndLocation(String learnedSongId, String situation, String location);

	List<WordEntity> findAllByLearnedSongId(String learnedSongId);

	List<WordEntity> findAllByLearnedSongIdAndSituationAndLocation(String learnedSongId, String situation, String location);

	Optional<WordEntity> findByLearnedSongIdAndWordIgnoreCase(String learnedSongId, String word);

}