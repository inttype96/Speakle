package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.ExpressionEntity;

import java.util.List;
import java.util.Optional;

public interface ExpressionRepository extends JpaRepository<ExpressionEntity, Long> {
	boolean existsByLearnedSongId(String learnedSongId);

	boolean existsByLearnedSongIdAndSituationAndLocation(String learnedSongId, String situation, String location);

	List<ExpressionEntity> findAllByLearnedSongId(String learnedSongId);

	List<ExpressionEntity> findAllByLearnedSongIdAndSituationAndLocation(String learnedSongId, String situation, String location);

	Optional<ExpressionEntity> findByLearnedSongIdAndExpressionIgnoreCase(String learnedSongId, String expression);
}