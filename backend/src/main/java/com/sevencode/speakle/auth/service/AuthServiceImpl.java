/**
 * 토큰 발급/관리 서비스-작성자:kang
 * 주요 기능 컨트롤러에서 유추 가능
 * */
package com.sevencode.speakle.auth.service;

import com.sevencode.speakle.auth.dto.LoginRequest;
import com.sevencode.speakle.auth.dto.RefreshRequest;
import com.sevencode.speakle.auth.dto.TokenResponse;
import com.sevencode.speakle.auth.entity.RefreshTokenEntity;
import com.sevencode.speakle.auth.exception.InvalidCredentialsException;
import com.sevencode.speakle.auth.exception.InvalidRefreshTokenException;
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

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

	private final SpringDataMemberJpa memberJpa;
	private final PasswordEncoder passwordEncoder;
	private final JwtProvider jwtProvider;

	// DB 보관용 서비스 (엔티티/레포지토리 래핑)
	private final RefreshTokenService refreshTokenService;

	@Value("${jwt.access-expiration}")
	private long accessExpiresInSec;
	@Value("${jwt.refresh-expiration}")
	private long refreshExpiresInSec;

	/** 로그인 refresh_token 저장 확인, 로그인 요청마다 refresh_tokens 생성 */
	@Override
	public TokenResponse login(LoginRequest req) {

		log.debug("로그인 요청 email={}", req.email());

		JpaMemberEntity user = memberJpa.findByEmailAndDeletedFalse(req.email())
			.orElseThrow(MemberNotFoundException::new);

		if (user.getPassword() == null || !passwordEncoder.matches(req.password(), user.getPassword())) {
			log.warn("로그인 실패 email={}", req.email());
			throw new InvalidCredentialsException("invalid credentials");
		}

		String access = jwtProvider.createAccessToken(user.getId(), user.getUsername());
		String refresh = jwtProvider.createRefreshToken(user.getId());

		log.debug("토큰 발급 성공 userId={}, username={}", user.getId(), user.getUsername());

		OffsetDateTime refreshExp = nowUtc().plusSeconds(refreshExpiresInSec);
		refreshTokenService.saveNew(user.getId(), refresh, refreshExp);

		log.debug("Refresh 토큰 저장 완료 userId={}, 만료시각={}", user.getId(), refreshExp);
		log.debug("Refresh 토큰={}, AccessToken={}", refresh.substring(0, Math.min(12, refresh.length())), access);

		return new TokenResponse("Bearer", access, refresh, accessExpiresInSec);
	}

	@Override
	@Transactional
	public TokenResponse refresh(RefreshRequest req) {
		String refresh = req.refreshToken();
		log.debug("리프레시 토큰 재발급 요청: prefix={}",
			refresh != null ? refresh.substring(0, Math.min(12, refresh.length())) + "..." : null);

		// 1) 형식/서명/타입/만료(클레임) 1차 체크
		if (!jwtProvider.isValid(refresh) ||
			!jwtProvider.isRefreshToken(refresh) ||
			jwtProvider.isRefreshTokenExpired(refresh)) {
			log.warn("리프레시 토큰 1차 검증 실패");
			throw new InvalidRefreshTokenException("유효하지 않은 리프레시 토큰입니다.");
		}

		// 2) DB에 존재(미만료)하는지 2차 체크
		RefreshTokenEntity stored = refreshTokenService.find(refresh)
			.orElseThrow(() -> {
				log.warn("리프레시 토큰 DB 조회 실패");
				throw new InvalidRefreshTokenException("유효하지 않은 리프레시 토큰입니다.");
			});

		if (stored.getRefreshExp().isBefore(nowUtc())) {
			log.info("리프레시 토큰 만료됨, 삭제 처리 id={}", stored.getId());
			refreshTokenService.revoke(refresh);
			throw new InvalidRefreshTokenException("만료된 리프레시 토큰입니다.");
		}

		Long userId = jwtProvider.extractUserId(refresh);
		log.debug("리프레시 토큰 소유자 userId={}", userId);

		// 3) 사용자 활성 상태 확인
		JpaMemberEntity user = memberJpa.findByIdAndDeletedFalse(userId)
			.orElseThrow(() -> {
				log.warn("리프레시 토큰 소유자(userId={})를 찾을 수 없음", userId);
				return new MemberNotFoundException();
			});

		// 4) 토큰 회전(rotate): 기존 토큰 폐기 → 새 토큰 저장
		refreshTokenService.revoke(refresh);
		String newRefresh = jwtProvider.createRefreshToken(userId);
		OffsetDateTime newExp = nowUtc().plusSeconds(refreshExpiresInSec);
		refreshTokenService.saveNew(userId, newRefresh, newExp);
		log.info("리프레시 토큰 회전 완료 userId={}, newExp={}", userId, newExp);

		// 5) Access 재발급
		String newAccess = jwtProvider.createAccessToken(userId, user.getUsername());
		log.debug("액세스 토큰 재발급 완료 userId={}, username={}", userId, user.getUsername());

		return new TokenResponse("Bearer", newAccess, newRefresh, accessExpiresInSec);
	}

	@Override
	@Transactional
	public void logout(String refreshToken) {
		if (refreshToken == null || refreshToken.isBlank()) {
			log.debug("로그아웃 요청: refreshToken 없음 → 무시");
			return;
		}
		refreshTokenService.revoke(refreshToken);
		log.info("로그아웃 완료: refreshToken prefix={}",
			refreshToken.substring(0, Math.min(12, refreshToken.length())) + "...");
	}

	private static OffsetDateTime nowUtc() {
		return OffsetDateTime.now(ZoneOffset.UTC);
	}

	@Override
	public void logoutAll(Long userId) {
		long deletedCount = refreshTokenService.revokeAll(userId);
		log.info("로그아웃 처리 완료: userId={}, deletedCount={}", userId, deletedCount);
	}
}
