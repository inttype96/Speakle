package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LearnedSongRepository extends JpaRepository<LearnedSongEntity, Long> {

    boolean existsByUserId(Long userId);

    Page<LearnedSongEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<LearnedSongEntity> findByUserIdAndSongIdAndSituationAndLocation(Long userId, String songId, String situation, String location);
}
