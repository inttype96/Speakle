/** 주석-미작성-작성자:kang*/
package com.sevencode.speakle.auth.exception;

// 유효하지 않은(또는 만료된) 리프레시 토큰
public class InvalidRefreshTokenException extends RuntimeException {
	public InvalidRefreshTokenException(String message) {
		super(message);
	}
}