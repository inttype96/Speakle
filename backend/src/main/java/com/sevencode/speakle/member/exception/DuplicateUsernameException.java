package com.sevencode.speakle.member.exception;

/** 409 Conflict: 이미 사용 중인 사용자 이름 */
public class DuplicateUsernameException extends RuntimeException {
	public DuplicateUsernameException(String message) {
		super(message);
	}
}