package com.sevencode.speakle.event.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FailedMessageInfo {
	private UserRegisteredMessage originalMessage;
	private String errorMessage;
	private Instant failedAt;
	private int retryCount;
	private String messageId;
}
