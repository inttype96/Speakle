package com.sevencode.speakle.member.exception;

public class InvalidPasswordException extends DomainValidationException {
	public InvalidPasswordException(String message) {
		super("INVALID_PASSWORD", message);
	}
}