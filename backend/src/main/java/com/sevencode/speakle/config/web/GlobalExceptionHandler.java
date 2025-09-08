package com.sevencode.speakle.config.web;

import com.sevencode.speakle.member.exception.DomainValidationException;
import com.sevencode.speakle.member.exception.DuplicateEmailException;
import com.sevencode.speakle.member.exception.DuplicateUsernameException;
import com.sevencode.speakle.member.exception.MemberNotFoundException;

import lombok.extern.slf4j.Slf4j;

import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;

import jakarta.validation.ConstraintViolationException;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final String CORR_KEY = "corrId"; // CorrelationFilter와 동일

	private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String code, String msg) {
		String corr = MDC.get(CORR_KEY);
		ApiErrorResponse body = new ApiErrorResponse(code, msg, corr, OffsetDateTime.now());
		return new ResponseEntity<>(body, new HttpHeaders(), status);
	}

	// ── 409: 리소스 충돌(중복) ───────────────────────────────────────────────
	@ExceptionHandler(DuplicateEmailException.class)
	public ResponseEntity<ApiErrorResponse> handleDuplicateEmail(DuplicateEmailException ex) {
		log.warn("DuplicateEmail: {}", ex.getMessage());
		return build(HttpStatus.CONFLICT, "EMAIL_DUPLICATE", ex.getMessage());
	}

	@ExceptionHandler(DuplicateUsernameException.class)
	public ResponseEntity<ApiErrorResponse> handleDuplicateUsername(DuplicateUsernameException ex) {
		log.warn("DuplicateUsername: {}", ex.getMessage());
		return build(HttpStatus.CONFLICT, "USERNAME_DUPLICATE", ex.getMessage());
	}

	// ── 400: DTO(@Valid) 바디 검증 실패 ─────────────────────────────────────
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
		List<org.springframework.validation.FieldError> fields = ex.getBindingResult().getFieldErrors();
		String msg = fields.isEmpty()
			? "Validation failed"
			: fields.get(0).getField() + ": " + fields.get(0).getDefaultMessage();
		log.warn("Validation error: {}", msg);
		return build(HttpStatus.BAD_REQUEST, "INVALID_ARGUMENT", msg);
	}

	// ── 400: 경로/쿼리 파라미터 검증 실패(@Validated) ─────────────────────
	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
		String msg = ex.getConstraintViolations().stream().findFirst()
			.map(v -> v.getPropertyPath() + ": " + v.getMessage())
			.orElse("Constraint violation");
		log.warn("Constraint violation: {}", msg);
		return build(HttpStatus.BAD_REQUEST, "INVALID_ARGUMENT", msg);
	}

	// ── 400: JSON 파싱/타입/파라미터 오류 ──────────────────────────────────
	@ExceptionHandler({
		HttpMessageNotReadableException.class,        // JSON 문법 오류, 타입 미스 등
		MethodArgumentTypeMismatchException.class,    // 경로/쿼리 타입 불일치
		MissingServletRequestParameterException.class // 필수 파라미터 누락
	})
	public ResponseEntity<ApiErrorResponse> handleBadRequest(Exception ex) {
		log.warn("Bad request: {}", ex.getMessage());
		return build(HttpStatus.BAD_REQUEST, "INVALID_ARGUMENT", "Invalid request");
	}

	@ExceptionHandler(MemberNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleMemberNotFound(MemberNotFoundException ex) {
		// 404 + 코드는 "USER_NOT_FOUND" 등으로 명확히
		return build(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", ex.getMessage());
	}

	// ── 405/415: 메서드/미디어타입 ──────────────────────────────────────────
	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<ApiErrorResponse> handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
		log.warn("Method not allowed: {}", ex.getMessage());
		return build(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "지원하지 않는 HTTP 메서드입니다.");
	}

	@ExceptionHandler(HttpMediaTypeNotSupportedException.class)
	public ResponseEntity<ApiErrorResponse> handleUnsupportedMediaType(HttpMediaTypeNotSupportedException ex) {
		log.warn("Unsupported media type: {}", ex.getMessage());
		return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_MEDIA_TYPE", "지원하지 않는 Content-Type입니다.");
	}

	// ── 400: 도메인 값 검증 실패(VO) ────────────────────────────────────────
	@ExceptionHandler(DomainValidationException.class)
	public ResponseEntity<ApiErrorResponse> handleDomainValidation(DomainValidationException ex) {
		log.warn("Domain validation: {} - {}", ex.getClass().getSimpleName(), ex.getMessage());
		return build(HttpStatus.BAD_REQUEST, ex.getCode(), ex.getMessage());
	}

	// ── 500: 그 외 모든 예외 ────────────────────────────────────────────────
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiErrorResponse> handleUnhandled(Exception ex) {
		log.error("Unhandled exception", ex);
		return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "서버 오류가 발생했습니다.");
	}
}
