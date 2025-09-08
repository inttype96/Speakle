package com.sevencode.speakle.member.domain.vo;

import com.sevencode.speakle.member.exception.InvalidPasswordException;

/*
 * usage
 * ---
 * is_nomal
 * PasswordHash pw = PasswordHash.ofHashed(passwordEncoder.encode(rawPassword));
 * ---
 * is_social
 * PasswordHash pw = PasswordHash.none();
 */
public final class PasswordHash {

	private final String value;

	private PasswordHash(String value) {
		this.value = value;
	}

	/** 일반 가입: 반드시 해시 문자열 필요 */
	public static PasswordHash ofHashed(String value) {
		if (value == null || value.length() < 60) {
			throw new InvalidPasswordException("Invalid password hash");
		}
		return new PasswordHash(value);
	}

	/** 소셜 로그인: 비밀번호 없음 */
	public static PasswordHash none() {
		return new PasswordHash(null);
	}

	public boolean isPresent() {
		return value != null;
	}

	public String getValue() {
		return value;
	}
}