package com.sevencode.speakle.event.exception;

public class EventAcknowledgmentException extends EventException {
	public EventAcknowledgmentException(String message) {
		super("EVENT_ACKNOWLEDGMENT_FAILED", message);
	}

	public EventAcknowledgmentException(String message, Throwable cause) {
		super("EVENT_ACKNOWLEDGMENT_FAILED", message, cause);
	}
}