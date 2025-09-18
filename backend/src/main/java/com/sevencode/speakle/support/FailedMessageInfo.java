package com.sevencode.speakle.support;

import java.time.Instant;

import lombok.Builder;

/** DLQ 저장용 메타 데이터 */
@Builder
public record FailedMessageInfo(
	String streamKey,
	String group,
	String messageId,
	String payload,        // 원본 'data' JSON
	String error,          // 예외 메시지
	String stackTrace,     // 간단 스택
	int retryCount,
	Instant firstFailedAt,
	Instant lastFailedAt,
	int version            // 페이로드 버전 (ex. 1)
) {}
