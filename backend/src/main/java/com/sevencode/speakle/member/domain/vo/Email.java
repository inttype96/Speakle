package com.sevencode.speakle.member.domain.vo;

import java.util.Objects;
import java.util.regex.Pattern;

import com.sevencode.speakle.member.exception.InvalidEmailException;

public final class Email {

	private static final Pattern P = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

	private final String value;

	private Email(String value) {
		this.value = value;
	}

	/** 소셜 가입 등에서 사용: null/blank 허용, 값이 있으면 형식 검증 */
	public static Email ofOptional(String value) {
		if (value == null || value.isBlank()) {
			return new Email(null);
		}
		if (!P.matcher(value).matches()) {
			throw new InvalidEmailException("Invalid email: " + value);
		}
		return new Email(value.toLowerCase());
	}

	/** 일반 회원가입에서 사용: null/blank 허용하지 않음 */
	public static Email ofRequired(String value) {
		if (value == null || value.isBlank()) {
			throw new InvalidEmailException("Email is required");
		}
		return ofOptional(value);
	}

	public boolean isPresent() {
		return value != null;
	}

	public String getValue() {
		return value;
	}

	@Override
	public String toString() {
		return value;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o)
			return true;
		if (!(o instanceof Email))
			return false;
		Email email = (Email)o;
		return Objects.equals(value, email.value);
	}

	@Override
	public int hashCode() {
		return Objects.hash(value);
	}
}