package com.sevencode.speakle.event.exception;

public class EventSerializationException extends EventException {
	public EventSerializationException(String message) {
		super("EVENT_SERIALIZATION_FAILED", message);
	}

	public EventSerializationException(String message, Throwable cause) {
		super("EVENT_SERIALIZATION_FAILED", message, cause);
	}
}