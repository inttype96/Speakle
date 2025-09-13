package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.SpeakingEntity;
import com.sevencode.speakle.learn.domain.entity.SpeakingResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpeakingResultRepository extends JpaRepository<SpeakingResultEntity, Long> {
}
