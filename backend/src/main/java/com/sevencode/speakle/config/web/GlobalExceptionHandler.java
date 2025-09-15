/*
 * GlobalExceptionHandler-작성자:kang
 *
 * ✦ 역할
 *   - @RestControllerAdvice 기반 전역 예외 처리기
 *   - 애플리케이션 전반에서 발생하는 예외를 ApiErrorResponse 포맷(JSON)으로 변환
 *
 * ✦ 처리 범위
 *   - 400: 잘못된 요청 (DTO 검증 실패, JSON 파싱 오류, 잘못된 파라미터 등)
 *   - 404: 존재하지 않는 사용자 / 잘못된 경로 요청
 *   - 405/415: 지원하지 않는 HTTP 메서드 / Content-Type
 *   - 409: 이메일·닉네임 중복
 *   - 500: 그 외 처리되지 않은 모든 예외
 */
package com.sevencode.speakle.config.web;

import com.sevencode.speakle.common.dto.ResponseWrapper;
import com.sevencode.speakle.member.exception.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.OffsetDateTime;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	private ResponseEntity<ResponseWrapper<Void>> fail(HttpStatus status, String message) {
		HttpHeaders headers = new HttpHeaders();
		String corr = MDC.get("corrId");
		if (corr != null) {
			headers.add("X-Correlation-ID", corr);
			headers.add("X-Correlation-Id", corr);
		}
		headers.add("X-Timestamp", OffsetDateTime.now().toString());
		return new ResponseEntity<>(ResponseWrapper.fail(status.value(), message), headers, status);
	}
    // 409 충돌(중복)
    @ExceptionHandler({DuplicateEmailException.class, DuplicateUsernameException.class, DataIntegrityViolationException.class})
    public ResponseEntity<ResponseWrapper<Void>> conflict(RuntimeException ex) {
        log.warn("Conflict: {}", ex.getMessage());
        return fail(HttpStatus.CONFLICT, ex.getMessage());
    }

    // 404
    @ExceptionHandler(MemberNotFoundException.class)
    public ResponseEntity<ResponseWrapper<Void>> notFound(MemberNotFoundException ex) {
        return fail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // 400 (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseWrapper<Void>> badRequest(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .orElse("요청 값이 올바르지 않습니다.");
        log.warn("Validation: {}", msg);
        return fail(HttpStatus.BAD_REQUEST, msg);
    }

    // 400 (@Validated, 파라미터)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ResponseWrapper<Void>> constraint(ConstraintViolationException ex) {
        String msg = ex.getConstraintViolations().stream().findFirst()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .orElse("요청 값이 올바르지 않습니다.");
        log.warn("Constraint: {}", msg);
        return fail(HttpStatus.BAD_REQUEST, msg);
    }

    // 400 (형식/파싱/타입)
    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<ResponseWrapper<Void>> badFormat(Exception ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return fail(HttpStatus.BAD_REQUEST, "Invalid request");
    }

    // 405/415
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ResponseWrapper<Void>> methodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        log.warn("Method not allowed: {}", ex.getMessage());
        return fail(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 HTTP 메서드입니다.");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ResponseWrapper<Void>> unsupported(HttpMediaTypeNotSupportedException ex) {
        log.warn("Unsupported media type: {}", ex.getMessage());
        return fail(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "지원하지 않는 Content-Type입니다.");
    }

    // 404 잘못된 경로
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ResponseWrapper<Void>> noHandler(NoHandlerFoundException ex, HttpServletRequest req) {
        log.warn("No handler: {} {}", ex.getHttpMethod(), ex.getRequestURL());
        return fail(HttpStatus.NOT_FOUND, "요청하신 경로를 찾을 수 없습니다.");
    }

    // 500
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseWrapper<Void>> unhandled(Exception ex) {
        log.error("Unhandled", ex);
        return fail(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");
    }
}