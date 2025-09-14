package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.BlankEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BlankRepository extends JpaRepository<BlankEntity, Long> {
    List<BlankEntity> findByLearnedSongId(Long learnedSongId);
}
