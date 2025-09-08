package com.sevencode.speakle.member.domain.vo;

import com.sevencode.speakle.member.exception.InvalidUsernameException;

public final class Username {

	private final String value;

	/**
	 * 생성자 (검증 포함)
	 * @param value 사용자명 원본 문자열
	 * @throws IllegalArgumentException null 또는 길이 < 2 / > 50 일 경우
	 */
	public Username(String value) {
		if (value == null || value.isBlank())
			throw new InvalidUsernameException("Username is required");
		int len = value.codePointCount(0, value.length());
		if (len < 2 || len > 20)
			throw new InvalidUsernameException("Username length must be 2~20");
		// 필요 시 금지 문자 검증 추가
		this.value = value;
	}

	public String getValue() {
		return value;
	}
}
