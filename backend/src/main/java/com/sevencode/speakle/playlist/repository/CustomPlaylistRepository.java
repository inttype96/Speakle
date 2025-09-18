package com.sevencode.speakle.playlist.repository;

import com.sevencode.speakle.playlist.entity.CustomPlaylist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomPlaylistRepository extends JpaRepository<CustomPlaylist, Long> {

	// 사용자별 플레이리스트 조회
	List<CustomPlaylist> findByUserIdOrderByCreatedAtDesc(Long userId);

	// 사용자별 플레이리스트 페이징
	Page<CustomPlaylist> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

	// 공개 플레이리스트 조회
	List<CustomPlaylist> findByIsPublicTrueOrderByCreatedAtDesc();

	// 사용자의 특정 플레이리스트 조회
	Optional<CustomPlaylist> findByIdAndUserId(Long id, Long userId);


	// 사용자의 플레이리스트 수 조회
	@Query("SELECT COUNT(p) FROM CustomPlaylist p WHERE p.userId = :userId")
	long countByUserId(@Param("userId") Long userId);

	// 플레이리스트 이름으로 검색 (사용자별)
	@Query("SELECT p FROM CustomPlaylist p WHERE p.userId = :userId AND LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
	List<CustomPlaylist> findByUserIdAndNameContainingIgnoreCase(@Param("userId") Long userId, @Param("name") String name);
}
