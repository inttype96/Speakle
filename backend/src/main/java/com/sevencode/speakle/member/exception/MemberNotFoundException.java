package com.sevencode.speakle.member.exception;

/** 404 Not Found: 요청한 사용자를 찾을 수 없음 */
public class MemberNotFoundException extends RuntimeException {
	public MemberNotFoundException() {
		super("사용자를 찾을 수 없습니다.");
	}

	public MemberNotFoundException(String message) {
		super(message);
	}
}