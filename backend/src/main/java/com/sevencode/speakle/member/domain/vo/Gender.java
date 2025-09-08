package com.sevencode.speakle.member.domain.vo;

public enum Gender {
	FEMALE("female"),
	MALE("male"),
	NONE("not specified");  // 기본값

	private final String label;

	Gender(String label) {
		this.label = label;
	}

	/** 사용자/로그 등에서 노출할 영문 레이블 */
	public String getLabel() {
		return label;
	}

	/**
	 * 문자열 → Gender 변환 (엄격 모드)
	 * - null/blank: NONE
	 * - 유효하지 않은 값: IllegalArgumentException
	 *
	 * 허용 입력 예:
	 *  - "FEMALE", "female" → FEMALE
	 *  - "MALE", "male"     → MALE
	 *  - "NONE", "none"     → NONE
	 */
	public static Gender from(String value) {
		if (value == null || value.isBlank()) {
			return NONE;
		}
		try {
			return Gender.valueOf(value.trim().toUpperCase());
		} catch (IllegalArgumentException ex) {
			throw new IllegalArgumentException("Invalid gender value: " + value);
		}
	}
}
