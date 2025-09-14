package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.SpeakingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpeakingRepository extends JpaRepository<SpeakingEntity, Long> {
    Optional<SpeakingEntity> findByLearnedSongIdAndQuestionNumber(Long learnedSongId, Integer questionNumber);
}
