package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.IdiomEntity;

import java.util.List;
import java.util.Optional;

public interface IdiomRepository extends JpaRepository<IdiomEntity, Long> {
	boolean existsByLearnedSongId(String learnedSongId);

	boolean existsByLearnedSongIdAndSituationAndLocation(String learnedSongId, String situation, String location);

	List<IdiomEntity> findAllByLearnedSongId(String learnedSongId);

	List<IdiomEntity> findAllByLearnedSongIdAndSituationAndLocation(String learnedSongId, String situation, String location);

	Optional<IdiomEntity> findByLearnedSongIdAndPhraseIgnoreCase(String learnedSongId, String phrase);
}