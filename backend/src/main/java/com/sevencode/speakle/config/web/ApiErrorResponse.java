package com.sevencode.speakle.config.web;

import java.time.OffsetDateTime;

public record ApiErrorResponse(
	String code,           // 에러 코드(문자열)
	String message,        // 사용자 메시지
	String correlationId,  // 추적용 ID (MDC의 correlationId)
	OffsetDateTime timestamp // 서버 시간(UTC)
) {
}