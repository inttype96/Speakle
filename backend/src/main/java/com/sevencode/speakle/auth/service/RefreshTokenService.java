package com.sevencode.speakle.auth.service;

import com.sevencode.speakle.auth.entity.RefreshTokenEntity;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface RefreshTokenService {

	/** 새 리프레시 토큰 저장 */
	RefreshTokenEntity saveNew(Long userId, String refreshToken, OffsetDateTime refreshExp);

	/** 토큰 단건 조회 */
	Optional<RefreshTokenEntity> find(String refreshToken);

	/** 해당 토큰만 폐기(삭제) */
	void revoke(String refreshToken);

	/** 사용자 토큰 전량 폐기(모든 기기 로그아웃) */
	long revokeAll(Long userId);

	/** 만료분 청소(스케줄러/관리용) */
	long cleanupExpired();
}
