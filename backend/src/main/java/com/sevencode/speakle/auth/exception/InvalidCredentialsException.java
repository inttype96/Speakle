/** 주석-미작성-작성자:kang*/
package com.sevencode.speakle.auth.exception;

// 잘못된 자격증명(로그인 실패)
public class InvalidCredentialsException extends RuntimeException {
	public InvalidCredentialsException(String message) {
		super(message);
	}
}
