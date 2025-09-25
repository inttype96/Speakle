package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.LearningSentence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LearningSentenceRepository extends JpaRepository<LearningSentence, Long> {

    List<LearningSentence> findByLearnedSongIdOrderByOrder(Long learnedSongId);

    List<LearningSentence> findByUserIdOrderByCreatedAtDesc(Long userId);
}