package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.SpeakingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpeakingRepository extends JpaRepository<SpeakingEntity, Long> {
}
