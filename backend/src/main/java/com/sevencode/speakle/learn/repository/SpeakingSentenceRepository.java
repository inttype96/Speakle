package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.parser.entity.SentenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpeakingSentenceRepository extends JpaRepository<SentenceEntity, Long> {
    List<SentenceEntity> findByLearnedSongIdOrderByIdAsc(String learnedSongId);
}
