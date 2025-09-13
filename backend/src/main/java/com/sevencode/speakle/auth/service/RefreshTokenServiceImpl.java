/**
 * 리프레시 토큰 저장 서비스-작성자:kang
 * 주요 기능 컨트롤러에서 유추 가능
 * */
package com.sevencode.speakle.auth.service;

import com.sevencode.speakle.auth.entity.RefreshTokenEntity;
import com.sevencode.speakle.auth.repository.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class RefreshTokenServiceImpl implements RefreshTokenService {

	private final RefreshTokenRepository repo;

	@Override
	public RefreshTokenEntity saveNew(Long userId, String refreshToken, OffsetDateTime refreshExp) {
		RefreshTokenEntity e = RefreshTokenEntity.of(userId, refreshToken, refreshExp);
		return repo.save(e);
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<RefreshTokenEntity> find(String refreshToken) {
		return repo.findByRefreshToken(refreshToken);
	}

	@Override
	public void revoke(String refreshToken) {
		repo.deleteByRefreshToken(refreshToken);
	}

	@Override
	public long revokeAll(Long userId) {
		return repo.deleteByUserId(userId);
	}

	@Override
	public long cleanupExpired() {
		OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
		return repo.deleteByRefreshExpBefore(now);
	}
}
