package com.sevencode.speakle.member.domain.vo;

public final class ProfileImageUrl {

	private final String value;

	/**
	 * 생성자 (검증 포함)
	 * @param value 프로필 이미지 URL
	 * @throws IllegalArgumentException 문자열이 500자를 초과하는 경우
	 */
	public ProfileImageUrl(String value) {
		if (value != null && value.length() > 500) {
			throw new IllegalArgumentException("profile image url too long");
		}
		this.value = value;
	}

	public String getValue() {
		return value;
	}
}
