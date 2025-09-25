package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.WordEntity;

import java.util.List;
import java.util.Optional;

public interface WordRepository extends JpaRepository<WordEntity, Long> {
	boolean existsBySongId(String songId);

	boolean existsBySongIdAndSituationAndLocation(String songId, String situation, String location);

	List<WordEntity> findAllBySongId(String songId);

	List<WordEntity> findAllBySongIdAndSituationAndLocation(String songId, String situation, String location);

	Optional<WordEntity> findBySongIdAndWordIgnoreCase(String songId, String word);

}