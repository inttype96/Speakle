package com.sevencode.speakle.auth.repository;

import com.sevencode.speakle.auth.entity.RefreshTokenEntity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {

	Optional<RefreshTokenEntity> findByRefreshToken(String refreshToken);

	boolean existsByUserIdAndRefreshExpAfter(Long userId, OffsetDateTime now);

	long deleteByUserId(Long userId);

	long deleteByRefreshToken(String refreshToken);

	long deleteByRefreshExpBefore(OffsetDateTime threshold);
}
