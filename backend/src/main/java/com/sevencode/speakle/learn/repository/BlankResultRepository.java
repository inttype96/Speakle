package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.learn.domain.entity.BlankResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlankResultRepository extends JpaRepository<BlankResultEntity, Long> {
}
