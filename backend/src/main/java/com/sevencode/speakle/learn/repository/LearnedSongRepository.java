package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearnedSongRepository extends JpaRepository<LearnedSongEntity, Long> {

    boolean existsByUserId(Long userId);

    Page<LearnedSongEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
