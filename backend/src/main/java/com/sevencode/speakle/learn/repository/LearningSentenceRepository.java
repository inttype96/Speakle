package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.LearningSentence;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LearningSentenceRepository extends JpaRepository<LearningSentence, Long> {

    List<LearningSentence> findByLearnedSongIdOrderByOrder(Long learnedSongId);

    List<LearningSentence> findByUserIdOrderByCreatedAtDesc(Long userId);
}