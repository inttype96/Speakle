package com.sevencode.speakle.member.repository;

/*
 * SpringDataMemberJpa
 * ------------------------------------------------------------
 * 역할: JpaMemberEntity 기본 CRUD 제공 (Spring Data JPA)
 *  - 복잡 쿼리는 필요 시 @Query 로 확장
 */

import com.sevencode.speakle.member.domain.entity.JpaMemberEntity;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataMemberJpa extends JpaRepository<JpaMemberEntity, Long> {
	// boolean existsByEmail(String email);
	boolean existsByUsername(String username);

	Optional<JpaMemberEntity> findByEmail(String email);

	Optional<JpaMemberEntity> findByEmailAndDeletedFalse(String email);

	Optional<JpaMemberEntity> findByIdAndDeletedFalse(Long id);

	boolean existsByUsernameAndDeletedFalse(String username);

}