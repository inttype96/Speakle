package com.sevencode.speakle.member.exception;

/** 400 Bad Request: 이메일 형식 오류 */
public class InvalidEmailException extends DomainValidationException {
	public InvalidEmailException(String message) {
		super("INVALID_EMAIL", message);
	}
}