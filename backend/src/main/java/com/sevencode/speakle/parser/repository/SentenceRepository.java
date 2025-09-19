package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.SentenceEntity;

import java.util.List;
import java.util.Optional;

public interface SentenceRepository extends JpaRepository<SentenceEntity, Long> {
	boolean existsBySongId(String songId);

	boolean existsBySongIdAndSituationAndLocation(String songId, String situation, String location);

	List<SentenceEntity> findAllBySongId(String songId);

	List<SentenceEntity> findAllBySongIdAndSituationAndLocation(String songId, String situation, String location);

	Optional<SentenceEntity> findBySongIdAndSentenceIgnoreCase(String songId, String sentence);
}