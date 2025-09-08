package com.sevencode.speakle.member.exception;

public class InvalidUsernameException extends DomainValidationException {
	public InvalidUsernameException(String message) {
		super("INVALID_USERNAME", message);
	}
}