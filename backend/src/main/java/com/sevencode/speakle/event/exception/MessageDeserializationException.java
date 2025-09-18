package com.sevencode.speakle.event.exception;

public class MessageDeserializationException extends EventException {
	public MessageDeserializationException(String message) {
		super("MESSAGE_DESERIALIZATION_FAILED", message);
	}

	public MessageDeserializationException(String message, Throwable cause) {
		super("MESSAGE_DESERIALIZATION_FAILED", message, cause);
	}
}