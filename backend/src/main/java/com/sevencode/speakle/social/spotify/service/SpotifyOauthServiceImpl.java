package com.sevencode.speakle.social.spotify.service;

import com.sevencode.speakle.member.domain.Member;
import com.sevencode.speakle.member.domain.entity.JpaMemberEntity;
import com.sevencode.speakle.member.repository.SpringDataMemberJpa;
import com.sevencode.speakle.member.repository.mapper.MemberMapper;
import com.sevencode.speakle.social.spotify.config.SpotifyProperties;
import com.sevencode.speakle.social.spotify.dto.response.ProfileMe;
import com.sevencode.speakle.social.spotify.dto.response.TokenResponse;
import com.sevencode.speakle.social.spotify.entity.SpotifyTokenEntity;
import com.sevencode.speakle.social.spotify.entity.UserSocialAccountEntity;
import com.sevencode.speakle.social.spotify.exception.SpotifyAuthException;
import com.sevencode.speakle.social.spotify.repository.SpotifyTokenRepository;
import com.sevencode.speakle.social.spotify.repository.UserSocialAccountRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
public class SpotifyOauthServiceImpl implements SpotifyOauthService {

	private static final String PROVIDER = "spotify";

	// (외부 통신) Spotify 인증 서버: /api/token 등 OAuth 토큰 교환 담당
	private final WebClient spotifyAuthClient; // baseUrl = https://accounts.spotify.com
	// (외부 통신) Spotify Web API: /v1/me 등 리소스 접근 담당
	private final WebClient spotifyApiClient;  // baseUrl = https://api.spotify.com/v1

	// (설정) 클라이언트 자격/리다이렉트/스코프 등 환경변수 바인딩
	private final SpotifyProperties props;

	// (보안) 토큰은 반드시 암호화 저장/복호화 사용
	private final CryptoService crypto;

	// (영속화) 내부 유저 ↔ 외부 소셜 계정 연결 관리
	private final UserSocialAccountRepository accountRepo;
	// (영속화) Spotify 액세스/리프레시 토큰 관리
	private final SpotifyTokenRepository tokenRepo;

	// (유저 도메인) 기존 멤버 저장소 + 도메인 매퍼
	private final SpringDataMemberJpa memberJpa;
	private final MemberMapper memberMapper;
	private final PasswordEncoder passwordEncoder;

	// (CSRF 방어) OAuth state 임시 저장소 — 프로덕션은 Redis/DB 권장
	private final ConcurrentMap<String, Long> stateStore = new ConcurrentHashMap<>();
	private static final long STATE_TTL_MS = 5 * 60 * 1000L; // 5분 유효

	/**
	 * # 엔트리: Spotify /authorize URL 생성
	 * - 무엇: state 발급 후 authorize URL 조합
	 * - 왜: CSRF·계정 스와프 방지(state), FE가 이 URL로 리다이렉트
	 * - 주의: scope는 공백 구분, URL 인코딩 필수
	 */
	@Override
	public String entry() {
		String state = issueState(); // 1회성 state 발급(임시 저장)
		return UriComponentsBuilder.fromHttpUrl("https://accounts.spotify.com/authorize")
			.queryParam("client_id", props.getClientId())
			.queryParam("response_type", "code")
			.queryParam("redirect_uri", props.getRedirectUri())
			.queryParam("scope", props.getScopes()) // "streaming user-read-email ..."
			.queryParam("state", state)
			.build(true) // 인코딩 보장
			.toUriString();
	}

	/**
	 * # 콜백: state검증 → code교환 → /v1/me → 회원(JIT) → 연결/토큰저장 → Member 반환
	 * - 무엇: Spotify가 준 code와 state로 최종 로그인/연결을 완성
	 * - 왜: 프런트 신뢰 금지. 서버가 직접 Spotify와 통신해야 보안·정합성 보장
	 * - 주의:
	 *   * state 미검증 금지(CSRF/계정스와프)
	 *   * /v1/me로 본인 식별(프런트 전달 id/email은 불신)
	 *   * email scope가 없을 수 있음 → username fallback 설계
	 *   * 토큰은 반드시 암호화 저장
	 */
	@Override
	@Transactional
	public Member callback(String code, String state) {
		verifyAndConsumeState(state); // 1) CSRF 방어: 일회성·TTL 검증

		// 2) code -> token 교환 (accounts.spotify.com)
		TokenResponse token = exchangeAuthorizationCode(code, props.getRedirectUri());

		// 3) /v1/me (api.spotify.com) — Spotify가 인증한 사용자 정보 획득
		ProfileMe me = fetchMe(token.access_token());

		// 4) 이메일 우선 매칭, 없으면 JIT 신규 생성(스코프에 따라 email null 가능)
		JpaMemberEntity memberEntity = null;
		if (me.email() != null && !me.email().isBlank()) {
			memberEntity = memberJpa.findByEmailAndDeletedFalse(me.email()).orElse(null);
		}
		if (memberEntity == null) {
			memberEntity = new JpaMemberEntity();
			memberEntity.setEmail(me.email()); // DB 제약(email nullable) 확인 필요
			String username = (me.display_name() != null && !me.display_name().isBlank())
				? me.display_name()
				: ("sp_" + me.id()); // 이메일 없을 때 표시명/ID로 대체
			memberEntity.setUsername(username);
			// 비밀번호 기반 로그인은 사용하지 않더라도, 일단 랜덤 해시 저장(도메인 일관성)
			String raw = "oauth!" + randomState();
			memberEntity.setPassword(passwordEncoder.encode(raw));
			memberEntity.setDeleted(false);
			OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
			memberEntity.setCreatedAt(now);
			memberEntity.setUpdatedAt(now);
			memberEntity = memberJpa.save(memberEntity);
		}

		// 도메인 모델로 변환(상위 계층/정책과 호환)
		Member member = memberMapper.toDomain(memberEntity);

		// 5) 소셜 연결 + 토큰 저장(업서트)
		String spotifyUserId = me.id();
		OffsetDateTime exp = OffsetDateTime.now(ZoneOffset.UTC)
			.plusSeconds(token.expires_in() != null ? token.expires_in() : 3600);

		// (연결 테이블) 유저 ↔ SPOTIFY 계정 맵핑
		var link = accountRepo.findByUserIdAndProvider(member.getId(), PROVIDER)
			.orElseGet(UserSocialAccountEntity::new);
		link.setUserId(member.getId());
		link.setProvider(PROVIDER);
		link.setProviderUserId(spotifyUserId);
		accountRepo.save(link);

		// (토큰 테이블) 액세스/리프레시/스코프/만료 업데이트 — 암호화 저장!
		var t = tokenRepo.findByUserIdAndProvider(member.getId(), PROVIDER)
			.orElseGet(SpotifyTokenEntity::new);
		t.setUserId(member.getId());
		t.setProvider(PROVIDER);
		t.setSpotifyUserId(spotifyUserId);
		t.setAccessTokenEnc(crypto.encrypt(token.access_token())); // 평문 금지
		if (token.refresh_token() != null && !token.refresh_token().isBlank()) {
			t.setRefreshTokenEnc(crypto.encrypt(token.refresh_token())); // 재연결 시 새로 줄 수 있음
		}
		t.setScope(token.scope());
		t.setExpiresAt(exp);
		tokenRepo.save(t);

		return member;
	}

	// ───────────────────── 내부 유틸(외부 통신/보안/랜덤) ─────────────────────

	/**
	 * Authorization Code → Token 교환
	 * - 무엇: /api/token (grant_type=authorization_code)
	 * - 왜: code는 일회성. 서버가 client_secret로 교환해야 안전
	 * - 주의: Basic Auth(client_id:client_secret), redirect_uri는 요청과 동일해야 함
	 *         실패 시 SpotifyAuthException 래핑
	 */
	private TokenResponse exchangeAuthorizationCode(String code, String redirectUri) {
		return spotifyAuthClient.post()
			.uri("/api/token")
			.headers(h -> {
				h.setBasicAuth(props.getClientId(), props.getClientSecret()); // Client 인증
				h.set(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE);
			})
			.body(BodyInserters
				.fromFormData("grant_type", "authorization_code")
				.with("code", code)
				.with("redirect_uri", redirectUri))
			.retrieve()
			.onStatus(HttpStatusCode::isError,
				resp -> resp.bodyToMono(String.class)
					.defaultIfEmpty("")
					.map(body -> (Throwable)new SpotifyAuthException("token_exchange_failed: " + body)))
			.bodyToMono(TokenResponse.class)
			.block(); // 주의: WebFlux에서 block은 비권장(여기선 명시적 동기 플로우)
	}

	/**
	 * Spotify 프로필 조회 (/v1/me)
	 * - 무엇: Bearer AccessToken으로 본인 식별 정보 조회
	 * - 왜: 프런트가 보낸 임의의 ID/이메일은 신뢰 불가 → 서버가 Spotify로부터 직접 확인
	 * - 주의: 401/403 등 에러 바디 기록해서 추적 용이하게
	 */
	private ProfileMe fetchMe(String accessToken) {
		return spotifyApiClient.get()
			.uri("/me")
			.headers(h -> h.setBearerAuth(accessToken))
			.retrieve()
			.onStatus(HttpStatusCode::isError,
				resp -> resp.bodyToMono(String.class)
					.defaultIfEmpty("")
					.map(body -> (Throwable)new SpotifyAuthException("fetch_me_failed: " + body)))
			.bodyToMono(ProfileMe.class)
			.block();
	}

	// (유틸) URL-safe 랜덤 문자열 — state/임시 비밀번호 등
	private static String randomState() {
		byte[] b = new byte[16];
		new SecureRandom().nextBytes(b);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
	}

	// (CSRF) state 발급: 현재시각+TTL을 in-memory에 저장 — 프로덕션은 Redis 권장
	private String issueState() {
		String s = randomState();
		stateStore.put(s, System.currentTimeMillis() + STATE_TTL_MS);
		return s;
	}

	// (CSRF) state 검증/소비: 존재·만료 확인 후 즉시 제거(재사용 금지)
	private void verifyAndConsumeState(String s) {
		Long exp = stateStore.remove(s);
		if (exp == null || exp < System.currentTimeMillis()) {
			throw new IllegalArgumentException("Invalid or expired state");
		}
	}
}
