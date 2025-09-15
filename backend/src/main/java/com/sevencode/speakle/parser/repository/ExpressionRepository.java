package com.sevencode.speakle.parser.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sevencode.speakle.parser.entity.ExpressionEntity;

import java.util.List;
import java.util.Optional;

public interface ExpressionRepository extends JpaRepository<ExpressionEntity, Long> {
	boolean existsByLearnedSongId(Long learnedSongId);

	List<ExpressionEntity> findAllByLearnedSongId(Long learnedSongId);

	Optional<ExpressionEntity> findByLearnedSongIdAndExpressionIgnoreCase(Long learnedSongId, String expression);
}