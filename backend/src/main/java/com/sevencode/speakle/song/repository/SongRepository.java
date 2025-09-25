package com.sevencode.speakle.song.repository;

import com.sevencode.speakle.song.domain.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SongRepository extends JpaRepository<Song, String> {
    Page<Song> findBySongIdIn(List<String> songIds, Pageable pageable);

    // 제목과 아티스트로 검색 (대소문자 무시, 부분 매칭)
    @Query("SELECT s FROM Song s WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(s.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.artists) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Song> findByTitleOrArtistsContainingIgnoreCase(@Param("keyword") String keyword, Pageable pageable);

    // 앨범 이미지가 없거나 특정 패턴이 아닌 곡들 찾기 (수정(소연))
    @Query("SELECT s FROM Song s WHERE s.albumImgUrl IS NULL OR s.albumImgUrl NOT LIKE :pattern")
    Page<Song> findByAlbumImgUrlIsNullOrAlbumImgUrlNotLike(@Param("pattern") String pattern, Pageable pageable);

    // 앨범 이미지가 없거나 특정 패턴이 아닌 곡들 개수 (수정(소연))
    @Query("SELECT COUNT(s) FROM Song s WHERE s.albumImgUrl IS NULL OR s.albumImgUrl NOT LIKE :pattern")
    long countByAlbumImgUrlIsNullOrAlbumImgUrlNotLike(@Param("pattern") String pattern);
}

