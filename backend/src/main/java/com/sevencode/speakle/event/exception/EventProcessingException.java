package com.sevencode.speakle.event.exception;

public class EventProcessingException extends EventException {
	public EventProcessingException(String message) {
		super("EVENT_PROCESSING_FAILED", message);
	}

	public EventProcessingException(String message, Throwable cause) {
		super("EVENT_PROCESSING_FAILED", message, cause);
	}
}