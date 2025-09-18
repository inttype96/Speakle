package com.sevencode.speakle.event.exception;

public class InvalidMessageFormatException extends EventException {
	public InvalidMessageFormatException(String message) {
		super("INVALID_MESSAGE_FORMAT", message);
	}

	public InvalidMessageFormatException(String message, Throwable cause) {
		super("INVALID_MESSAGE_FORMAT", message, cause);
	}
}