package com.sevencode.speakle.member.domain;

import com.sevencode.speakle.member.domain.vo.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public class Member {

	// ───────────────────────────────────────────────────────
	private final Long id;                       // DB PK (users.user_id), 신규 생성 시 null
	private final Email email;                   // VO: 유효성 보장

	// ───────────────────────────────────────────────────────
	private PasswordHash passwordHash;           // VO: 해시 문자열(평문 금지)
	private Username username;                   // VO: 길이/형식 제약

	// ───────────────────────────────────────────────────────
	private Gender gender;                       // FEMALE | MALE | NONE
	private LocalDate birth;                     // DATE
	private ProfileImageUrl profileImageUrl;     // VO: 최대 길이 검증

	// ───────────────────────────────────────────────────────
	private boolean deleted;
	private final OffsetDateTime createdAt;      // 생성 시각(UTC)
	private OffsetDateTime updatedAt;            // 최종 수정 시각(UTC)

	// 내부 생성자
	private Member(Long id, Email email, PasswordHash passwordHash, Username username,
		Gender gender, LocalDate birth, ProfileImageUrl profileImageUrl,
		boolean deleted, OffsetDateTime createdAt, OffsetDateTime updatedAt) {

		this.id = id;
		this.email = email;
		this.passwordHash = passwordHash;
		this.username = username;
		this.gender = (gender == null ? Gender.NONE : gender);
		this.birth = birth;
		this.profileImageUrl = profileImageUrl;

		this.deleted = deleted;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}

	// =========================================================================
	// 생성/복원 팩토리
	// =========================================================================

	/** MemberService.register용 팩토리 */
	public static Member create(Email email, PasswordHash passwordHash, Username username, Gender gender,
		LocalDate birth, String profileImageUrl) {

		OffsetDateTime now = OffsetDateTime.now();

		ProfileImageUrl imgVo =
			(profileImageUrl == null || profileImageUrl.isBlank()) ? null : new ProfileImageUrl(profileImageUrl);

		return new Member(null, email, passwordHash, username, (gender == null ? Gender.NONE : gender), birth, imgVo,
			false, now, now);
	}

	/**
	 * 신규 생성용 팩토리 (시간 주입형)
	 * - 테스트/감사정책에서 시간 제어가 필요할 때 사용
	 */
	public static Member createNew(Email email, PasswordHash hash, Username username, Gender gender, LocalDate birth,
		ProfileImageUrl img, OffsetDateTime now) {
		return new Member(null, email, hash, username, (gender == null ? Gender.NONE : gender), birth, img, false, now,
			now);
	}

	/**
	 * 영속 데이터 → 도메인 복원용 팩토리
	 * - 매퍼가 DB에서 읽은 값을 그대로 주입
	 */
	public static Member of(Long id,
		Email email,
		PasswordHash passwordHash,
		Username username,
		Gender gender,
		LocalDate birth,
		ProfileImageUrl profileImageUrl,
		boolean deleted,
		OffsetDateTime createdAt,
		OffsetDateTime updatedAt) {
		return new Member(
			id,
			email,
			passwordHash,
			username,
			(gender == null ? Gender.NONE : gender),
			birth,
			profileImageUrl,
			deleted,
			createdAt,
			updatedAt
		);
	}

	// =========================================================================
	// 도메인 동작 (상태 변경 시 updatedAt 반드시 갱신)
	// =========================================================================

	/** 비밀번호 교체(해시만 허용) */
	public void changePassword(PasswordHash newHash, OffsetDateTime now) {
		if (newHash == null)
			throw new IllegalArgumentException("passwordHash cannot be null");
		// NOTE: 정책적으로 "이전 해시와 동일 금지"가 필요하면 여기서 비교 검증
		this.passwordHash = newHash;
		this.updatedAt = now;
	}

	/** 프로필 변경(부분 업데이트 허용) */
	public void changeProfile(Username name,
		Gender gender,
		LocalDate birth,
		ProfileImageUrl img,
		OffsetDateTime now) {
		if (name != null)
			this.username = name;
		if (gender != null)
			this.gender = gender;
		if (birth != null)
			this.birth = birth;
		if (img != null)
			this.profileImageUrl = img;
		this.updatedAt = now;
	}

	/** 소프트 삭제 (복구는 별도 유스케이스에서 정의) */
	public void softDelete(OffsetDateTime now) {
		this.deleted = true;
		this.updatedAt = now;
	}

	// =========================================================================
	// getter
	// =========================================================================
	public Long getId() {
		return id;
	}

	public Email getEmail() {
		return email;
	}

	public PasswordHash getPasswordHash() {
		return passwordHash;
	}

	public Username getUsername() {
		return username;
	}

	public Gender getGender() {
		return gender;
	}

	public LocalDate getBirth() {
		return birth;
	}

	public ProfileImageUrl getProfileImageUrl() {
		return profileImageUrl;
	}

	public boolean isDeleted() {
		return deleted;
	}

	public OffsetDateTime getCreatedAt() {
		return createdAt;
	}

	public OffsetDateTime getUpdatedAt() {
		return updatedAt;
	}
}
