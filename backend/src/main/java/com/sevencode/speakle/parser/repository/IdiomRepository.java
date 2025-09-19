package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.IdiomEntity;

import java.util.List;
import java.util.Optional;

public interface IdiomRepository extends JpaRepository<IdiomEntity, Long> {
	boolean existsBySongId(String songId);

	boolean existsBySongIdAndSituationAndLocation(String songId, String situation, String location);

	List<IdiomEntity> findAllBySongId(String songId);

	List<IdiomEntity> findAllBySongIdAndSituationAndLocation(String songId, String situation, String location);

	Optional<IdiomEntity> findBySongIdAndPhraseIgnoreCase(String songId, String phrase);
}