package com.sevencode.speakle.common.exception;

import lombok.Getter;

/**
 * 암호화 오류 유형
 */
@Getter
public enum CryptoErrorType {
	ENCRYPTION_FAILED("암호화 실패"),
	DECRYPTION_FAILED("복호화 실패"),
	INVALID_KEY("잘못된 키"),
	INVALID_DATA("잘못된 데이터 형식"),
	EMPTY_INPUT("입력값 없음"),
	GENERAL("일반 오류");

	private final String description;

	CryptoErrorType(String description) {
		this.description = description;
	}
}
