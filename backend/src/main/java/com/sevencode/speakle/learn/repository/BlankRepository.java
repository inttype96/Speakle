package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.BlankEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlankRepository extends JpaRepository<BlankEntity, Long> {
    List<BlankEntity> findByLearnedSongId(Long learnedSongId);
    Optional<BlankEntity> findByLearnedSongIdAndQuestionNumber(Long learnedSongId, Integer questionNumber);
}
