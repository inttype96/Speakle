package com.sevencode.speakle.event.exception;

public class EventPublishException extends EventException {
	public EventPublishException(String message) {
		super("EVENT_PUBLISH_FAILED", message);
	}

	public EventPublishException(String message, Throwable cause) {
		super("EVENT_PUBLISH_FAILED", message, cause);
	}
}