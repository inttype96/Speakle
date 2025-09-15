package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.IdiomEntity;

import java.util.List;
import java.util.Optional;

public interface IdiomRepository extends JpaRepository<IdiomEntity, Long> {
	boolean existsByLearnedSongId(Long learnedSongId);

	List<IdiomEntity> findAllByLearnedSongId(Long learnedSongId);

	Optional<IdiomEntity> findByLearnedSongIdAndPhraseIgnoreCase(Long learnedSongId, String phrase);
}