package com.sevencode.speakle.member.exception;

/** 409 Conflict: 이미 사용 중인 이메일 */
public class DuplicateEmailException extends RuntimeException {
	public DuplicateEmailException(String message) {
		super(message);
	}
}
