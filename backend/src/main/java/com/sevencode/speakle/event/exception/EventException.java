package com.sevencode.speakle.event.exception;

public class EventException extends RuntimeException {
	private final String code;

	public EventException(String code, String message) {
		super(message);
		this.code = code;
	}

	public EventException(String code, String message, Throwable cause) {
		super(message, cause);
		this.code = code;
	}

	public String getCode() {
		return code;
	}
}