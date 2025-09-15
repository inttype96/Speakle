package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.DictationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DictationRepository extends JpaRepository<DictationEntity, Long> {
    Optional<DictationEntity> findByLearnedSongIdAndQuestionNumber(Long learnedSongId, Integer questionNumber);
    List<DictationEntity> findByLearnedSongId(Long learnedSongId);
}
