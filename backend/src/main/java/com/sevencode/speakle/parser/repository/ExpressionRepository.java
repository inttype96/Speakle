package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.ExpressionEntity;

import java.util.List;
import java.util.Optional;

public interface ExpressionRepository extends JpaRepository<ExpressionEntity, Long> {
	boolean existsBySongId(String songId);

	boolean existsBySongIdAndSituationAndLocation(String songId, String situation, String location);

	List<ExpressionEntity> findAllBySongId(String songId);

	List<ExpressionEntity> findAllBySongIdAndSituationAndLocation(String songId, String situation, String location);

	Optional<ExpressionEntity> findBySongIdAndExpressionIgnoreCase(String songId, String expression);
}