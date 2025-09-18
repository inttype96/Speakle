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

    Optional<Object> findFirstByLearnedSongIdOrderByOrderAsc(@NotNull(message = "learned_song_id는 필수입니다.") @Positive(message = "학습곡 ID는 양수여야 합니다.") Long learnedSongId);
}