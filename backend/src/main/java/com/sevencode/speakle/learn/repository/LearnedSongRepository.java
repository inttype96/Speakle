package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearnedSongRepository extends JpaRepository<LearnedSongEntity, Long> {

}
