package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.IdiomEntity;

import java.util.List;
import java.util.Optional;

public interface IdiomRepository extends JpaRepository<IdiomEntity, Long> {
	boolean existsByLearnedSongId(String learnedSongId);

	List<IdiomEntity> findAllByLearnedSongId(String learnedSongId);

	Optional<IdiomEntity> findByLearnedSongIdAndPhraseIgnoreCase(String learnedSongId, String phrase);
}