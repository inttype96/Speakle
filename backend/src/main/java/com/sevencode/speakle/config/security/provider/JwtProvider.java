package com.sevencode.speakle.config.security.provider;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Component
public class JwtProvider {

	private final SecretKey secretKey;
	private final Duration access;
	private final Duration refresh;

	public JwtProvider(
		@Value("${jwt.secret}") String secret,
		@Value("${jwt.access-expiration}") long accessSeconds,      // default 1h
		@Value("${jwt.refresh-expiration}") long refreshSeconds     // default 30d
	) {
		// HS512는 64바이트 이상 권장
		this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.access = Duration.ofSeconds(accessSeconds);
		this.refresh = Duration.ofSeconds(refreshSeconds);
	}

	// ── 발급 ──────────────────────────────────────────────────────────────────

	public String createAccessToken(Long userId, String username) {
		Instant now = Instant.now();
		Instant exp = now.plus(access);

		return Jwts.builder()
			.setHeaderParam(Header.TYPE, Header.JWT_TYPE)
			.setSubject(String.valueOf(userId))                 // sub = userId
			.addClaims(Map.of("username", username))
			.setIssuedAt(Date.from(now))
			.setExpiration(Date.from(exp))
			.signWith(secretKey, SignatureAlgorithm.HS512)
			.compact();
	}

	public String createRefreshToken(Long userId) {
		Instant now = Instant.now();
		Instant exp = now.plus(refresh);

		return Jwts.builder()
			.setHeaderParam(Header.TYPE, Header.JWT_TYPE)
			.setSubject(String.valueOf(userId))
			.claim("type", JwtTokenType.REFRESH.name())
			.setIssuedAt(Date.from(now))
			.setExpiration(Date.from(exp))
			.signWith(secretKey, SignatureAlgorithm.HS512)
			.compact();
	}

	// ── 검증/파싱 ─────────────────────────────────────────────────────────────

	/** 만료 여부만 판정 (만료면 true) */
	public boolean isExpired(String token) {
		try {
			parseClaims(token);
			return false;
		} catch (ExpiredJwtException e) {
			return true;
		}
	}

	/** Access 토큰이면서 만료되었는지 */
	public boolean isAccessTokenExpired(String token) {
		return !isRefreshToken(token) && isExpired(token);
	}

	/** Refresh 토큰이면서 만료되었는지 */
	public boolean isRefreshTokenExpired(String token) {
		return isRefreshToken(token) && isExpired(token);
	}

	/** 서명·만료·형식 검증 포함 간이 유효성 체크 */
	public boolean isValid(String token) {
		try {
			parseClaims(token);
			return true;
		} catch (JwtException | IllegalArgumentException e) {
			return false;
		}
	}

	/** 사용자 식별번호 추출 */
	public Long extractUserId(String token) {
		return Long.valueOf(parseClaims(token).getSubject());
	}

	/** 사용자 이름 추출 */
	public String extractUsername(String token) {
		return parseClaims(token).get("username", String.class);
	}

	/** 토큰 타입 확인 */
	public boolean isRefreshToken(String token) {
		String type = null;
		try {
			type = parseClaims(token).get("type", String.class);
		} catch (ExpiredJwtException e) {
			// 만료돼도 클레임(body)은 e.getClaims() 로 읽을 수 있음
			type = e.getClaims().get("type", String.class);
		}
		return JwtTokenType.REFRESH.name().equals(type);
	}

	private Claims parseClaims(String token) {
		return Jwts.parserBuilder()
			.setSigningKey(secretKey)
			.build()
			.parseClaimsJws(token)
			.getBody();
	}
}
