package com.sevencode.speakle.auth.service;

import com.sevencode.speakle.auth.dto.LoginRequest;
import com.sevencode.speakle.auth.dto.RefreshRequest;
import com.sevencode.speakle.auth.dto.TokenResponse;
import com.sevencode.speakle.auth.entity.RefreshTokenEntity;
import com.sevencode.speakle.config.security.provider.JwtProvider;
import com.sevencode.speakle.member.domain.entity.JpaMemberEntity;
import com.sevencode.speakle.member.exception.MemberNotFoundException;
import com.sevencode.speakle.member.repository.SpringDataMemberJpa;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

	private final SpringDataMemberJpa memberJpa;
	private final PasswordEncoder passwordEncoder;
	private final JwtProvider jwtProvider;

	// DB 보관용 서비스 (엔티티/레포지토리 래핑)
	private final RefreshTokenService refreshTokenService;

	@Value("${jwt.access-expiration}")
	private long accessExpiresInSec;   // 응답용 (초)
	@Value("${jwt.refresh-expiration}")
	private long refreshExpiresInSec;  // DB 저장용 (초)

	@Override
	public TokenResponse login(LoginRequest req) {
		// 1) 사용자 조회
		JpaMemberEntity user = memberJpa.findByEmailAndDeletedFalse(req.email())
			.orElseThrow(MemberNotFoundException::new);

		// 2) 비밀번호 검증 (소셜: password=null → 실패)
		if (user.getPassword() == null || !passwordEncoder.matches(req.password(), user.getPassword())) {
			// 전역 핸들러에서 401로 매핑하고 싶다면 InvalidCredentialsException 같은 커스텀 예외로 변경
			throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
		}

		// 3) 토큰 발급
		String access = jwtProvider.createAccessToken(user.getId(), user.getUsername());
		String refresh = jwtProvider.createRefreshToken(user.getId());

		// 4) Refresh 토큰 저장
		OffsetDateTime refreshExp = nowUtc().plusSeconds(refreshExpiresInSec);
		refreshTokenService.saveNew(user.getId(), refresh, refreshExp);

		// 5) 응답
		return new TokenResponse("Bearer", access, refresh, accessExpiresInSec);
	}

	@Override
	@Transactional
	public TokenResponse refresh(RefreshRequest req) {
		String refresh = req.refreshToken();

		// 1) 형식/서명/타입/만료(클레임) 1차 체크
		if (!jwtProvider.isValid(refresh) || !jwtProvider.isRefreshToken(refresh) || jwtProvider.isRefreshTokenExpired(
			refresh)) {
			throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
		}

		// 2) DB에 존재(미만료)하는지 2차 체크
		RefreshTokenEntity stored = refreshTokenService.find(refresh)
			.orElseThrow(() -> new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다."));
		if (stored.getRefreshExp().isBefore(nowUtc())) {
			// 만료된 DB 레코드는 정리해도 됨
			refreshTokenService.revoke(refresh);
			throw new IllegalArgumentException("만료된 리프레시 토큰입니다.");
		}

		Long userId = jwtProvider.extractUserId(refresh);

		// 3) 사용자 활성 상태 확인
		JpaMemberEntity user = memberJpa.findByIdAndDeletedFalse(userId)
			.orElseThrow(MemberNotFoundException::new);

		// 4) 토큰 회전(rotate): 기존 토큰 폐기 → 새 토큰 저장
		refreshTokenService.revoke(refresh);
		String newRefresh = jwtProvider.createRefreshToken(userId);
		OffsetDateTime newExp = nowUtc().plusSeconds(refreshExpiresInSec);
		refreshTokenService.saveNew(userId, newRefresh, newExp);

		// 5) Access 재발급
		String newAccess = jwtProvider.createAccessToken(userId, user.getUsername());

		return new TokenResponse("Bearer", newAccess, newRefresh, accessExpiresInSec);
	}

	@Override
	@Transactional
	public void logout(String refreshToken) {
		// 클라이언트가 보유한 refreshToken만 폐기(로그아웃-현재기기)
		if (refreshToken == null || refreshToken.isBlank())
			return;
		refreshTokenService.revoke(refreshToken);
	}

	private static OffsetDateTime nowUtc() {
		return OffsetDateTime.now(ZoneOffset.UTC);
	}
}
