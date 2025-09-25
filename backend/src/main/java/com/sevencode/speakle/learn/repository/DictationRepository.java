package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.DictationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DictationRepository extends JpaRepository<DictationEntity, Long> {
    Optional<DictationEntity> findByLearnedSongIdAndQuestionNumber(Long learnedSongId, Integer questionNumber);
    List<DictationEntity> findByLearnedSongId(Long learnedSongId);

    @Query("SELECT d.originSentence FROM DictationEntity d WHERE d.learnedSongId = :learnedSongId")
    List<String> findUsedSentencesByLearnedSongId(@Param("learnedSongId") Long learnedSongId);
}
