package com.sevencode.speakle.learn.repository;

import com.sevencode.speakle.member.domain.entity.JpaMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberAuthRepository extends JpaRepository<JpaMemberEntity, Long> {
    boolean existsByIdAndDeletedFalse(Long userId);
}
