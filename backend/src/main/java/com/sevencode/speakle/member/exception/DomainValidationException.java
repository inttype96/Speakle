package com.sevencode.speakle.member.exception;

/** 400 Bad Request: 도메인 값 검증 실패 공통 베이스 */
public class DomainValidationException extends RuntimeException {
	private final String code; // 에러 코드(응답에 그대로 사용)

	public DomainValidationException(String code, String message) {
		super(message);
		this.code = code;
	}

	public String getCode() {
		return code;
	}
}