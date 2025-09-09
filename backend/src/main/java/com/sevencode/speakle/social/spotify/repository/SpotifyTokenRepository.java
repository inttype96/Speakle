package com.sevencode.speakle.social.spotify.repository;

import com.sevencode.speakle.social.spotify.entity.SpotifyTokenEntity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/** 한명의 유저에 중복된 프로바이더는 없다는 전제 */
public interface SpotifyTokenRepository extends JpaRepository<SpotifyTokenEntity, Long> {
	Optional<SpotifyTokenEntity> findByUserIdAndProvider(Long userId, String provider);

	long deleteByUserIdAndProvider(Long userId, String provider);
}