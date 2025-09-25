package com.sevencode.speakle.playlist.repository;

import com.sevencode.speakle.playlist.entity.CustomPlaylistTrack;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomPlaylistTrackRepository extends JpaRepository<CustomPlaylistTrack, Long> {

	// 플레이리스트의 트랙들 조회 (추가 순으로)
	// List<CustomPlaylistTrack> findByPlaylistIdOrderByAddedAt(Long playlistId);
	// List<CustomPlaylistTrack> findByPlaylistIdOrderByAddedAtDesc(Long playlistId);

	// 재생 횟수 순 조회
	// List<CustomPlaylistTrack> findByPlaylistIdOrderByPlayCountDesc(Long playlistId);
	// List<CustomPlaylistTrack> findByPlaylistIdOrderByPlayCountAsc(Long playlistId);

	// 플레이리스트의 트랙들 페이징 (다양한 정렬 옵션)
	// Page<CustomPlaylistTrack> findByPlaylistIdOrderByAddedAt(Long playlistId, Pageable pageable);
	// Page<CustomPlaylistTrack> findByPlaylistIdOrderByAddedAtDesc(Long playlistId, Pageable pageable);
	// Page<CustomPlaylistTrack> findByPlaylistIdOrderByPlayCountDesc(Long playlistId, Pageable pageable);
	// Page<CustomPlaylistTrack> findByPlaylistIdOrderByPlayCountAsc(Long playlistId, Pageable pageable);

	// N+1 문제 해결을 위한 최적화된 쿼리들 (Song 정보와 함께 가져오기)
	@Query("SELECT t FROM CustomPlaylistTrack t JOIN FETCH t.song WHERE t.playlistId = :playlistId ORDER BY t.addedAt")
	List<CustomPlaylistTrack> findByPlaylistIdOrderByAddedAtOptimized(@Param("playlistId") Long playlistId);

	@Query("SELECT t FROM CustomPlaylistTrack t JOIN FETCH t.song WHERE t.playlistId = :playlistId ORDER BY t.addedAt DESC")
	List<CustomPlaylistTrack> findByPlaylistIdOrderByAddedAtDescOptimized(@Param("playlistId") Long playlistId);

	@Query("SELECT t FROM CustomPlaylistTrack t JOIN FETCH t.song WHERE t.playlistId = :playlistId ORDER BY t.playCount DESC")
	List<CustomPlaylistTrack> findByPlaylistIdOrderByPlayCountDescOptimized(@Param("playlistId") Long playlistId);

	@Query("SELECT t FROM CustomPlaylistTrack t JOIN FETCH t.song WHERE t.playlistId = :playlistId ORDER BY t.playCount ASC")
	List<CustomPlaylistTrack> findByPlaylistIdOrderByPlayCountAscOptimized(@Param("playlistId") Long playlistId);

	// 페이징을 위한 최적화된 쿼리들 (카운트 쿼리 분리)
	@Query(value = "SELECT t FROM CustomPlaylistTrack t JOIN FETCH t.song WHERE t.playlistId = :playlistId ORDER BY t.addedAt",
		   countQuery = "SELECT COUNT(t) FROM CustomPlaylistTrack t WHERE t.playlistId = :playlistId")
	Page<CustomPlaylistTrack> findByPlaylistIdOrderByAddedAtOptimized(@Param("playlistId") Long playlistId, Pageable pageable);

	@Query(value = "SELECT t FROM CustomPlaylistTrack t JOIN FETCH t.song WHERE t.playlistId = :playlistId ORDER BY t.addedAt DESC",
		   countQuery = "SELECT COUNT(t) FROM CustomPlaylistTrack t WHERE t.playlistId = :playlistId")
	Page<CustomPlaylistTrack> findByPlaylistIdOrderByAddedAtDescOptimized(@Param("playlistId") Long playlistId, Pageable pageable);

	@Query(value = "SELECT t FROM CustomPlaylistTrack t JOIN FETCH t.song WHERE t.playlistId = :playlistId ORDER BY t.playCount DESC",
		   countQuery = "SELECT COUNT(t) FROM CustomPlaylistTrack t WHERE t.playlistId = :playlistId")
	Page<CustomPlaylistTrack> findByPlaylistIdOrderByPlayCountDescOptimized(@Param("playlistId") Long playlistId, Pageable pageable);

	@Query(value = "SELECT t FROM CustomPlaylistTrack t JOIN FETCH t.song WHERE t.playlistId = :playlistId ORDER BY t.playCount ASC",
		   countQuery = "SELECT COUNT(t) FROM CustomPlaylistTrack t WHERE t.playlistId = :playlistId")
	Page<CustomPlaylistTrack> findByPlaylistIdOrderByPlayCountAscOptimized(@Param("playlistId") Long playlistId, Pageable pageable);

	// 특정 트랙이 플레이리스트에 있는지 확인
	boolean existsByPlaylistIdAndSongId(Long playlistId, String songId);

	// 플레이리스트에서 특정 트랙 조회
	Optional<CustomPlaylistTrack> findByPlaylistIdAndSongId(Long playlistId, String songId);

	// 플레이리스트의 트랙 수 조회
	@Query("SELECT COUNT(t) FROM CustomPlaylistTrack t WHERE t.playlistId = :playlistId")
	long countByPlaylistId(@Param("playlistId") Long playlistId);

	// 플레이리스트에서 트랙 삭제
	void deleteByPlaylistIdAndSongId(Long playlistId, String songId);

	// 플레이리스트의 모든 트랙 삭제
	void deleteByPlaylistId(Long playlistId);

	// 사용자의 플레이리스트에서 특정 노래들이 포함된 트랙 조회 (노래 추천 시 사용)
	@Query("SELECT t FROM CustomPlaylistTrack t WHERE t.userId = :userId AND t.songId IN :songIds")
	List<CustomPlaylistTrack> findByUserIdAndSongIdIn(@Param("userId") Long userId, @Param("songIds") List<String> songIds);

	// 특정 노래가 사용자의 플레이리스트에 포함되어 있는지 확인
	@Query("SELECT COUNT(t) > 0 FROM CustomPlaylistTrack t WHERE t.userId = :userId AND t.songId = :songId")
	boolean existsByUserIdAndSongId(@Param("userId") Long userId, @Param("songId") String songId);

	// 사용자의 특정 노래가 포함된 플레이리스트 목록 조회 (플레이리스트 멤버십 확인용)
	@Query("SELECT DISTINCT t.playlistId FROM CustomPlaylistTrack t WHERE t.userId = :userId AND t.songId = :songId")
	List<Long> findPlaylistIdsByUserIdAndSongId(@Param("userId") Long userId, @Param("songId") String songId);

	// 사용자의 모든 플레이리스트 트랙의 songId 조회
	@Query("SELECT DISTINCT t.songId FROM CustomPlaylistTrack t WHERE t.userId = :userId")
	List<String> findAllSongIdsByUserId(@Param("userId") Long userId);
}
