/*
 * ApiErrorResponse-작성자:knag
 *
 * API 에러 응답 표준 포맷 정의
 * - 모든 예외 상황을 전역 핸들러(GlobalExceptionHandler)에서 이 구조로 감싸 반환
 *
 * Fields:
 *   code          : 애플리케이션 내부 에러 코드 (e.g. USER_NOT_FOUND, INVALID_ARGUMENT)
 *   message       : 사용자에게 노출할 메시지 (친화적/로컬라이즈 가능)
 *   correlationId : 요청 추적용 ID (MDC에 담긴 corrId, 로그 상관관계 확인용)
 *   timestamp     : 서버 기준 발생 시각 (UTC, OffsetDateTime)
 */
package com.sevencode.speakle.config.web;

import java.time.OffsetDateTime;

public record ApiErrorResponse(
	String code,
	String message,
	String correlationId,
	OffsetDateTime timestamp
) {
}