package com.sevencode.speakle.reward.exception;

import com.sevencode.speakle.config.web.ApiErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.OffsetDateTime;

@Slf4j
@Order(1)
@RestControllerAdvice(basePackages = "com.sevencode.speakle.reward")
public class RewardExceptionHandler {
    private static final String CORR_KEY = "corrId";

    @ExceptionHandler(InsufficientPointsException.class)
    public ResponseEntity<ApiErrorResponse> handleInsufficientPoints(
            InsufficientPointsException ex, WebRequest request) {
        ApiErrorResponse errorResponse = createErrorResponse(
                "INSUFFICIENT_POINTS",
                "포인트 잔액이 부족합니다."
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(InvalidSourceTypeException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidSourceType(
            InvalidSourceTypeException ex, WebRequest request) {
        ApiErrorResponse errorResponse = createErrorResponse(
                "INVALID_SOURCE_TYPE",
                "유효하지 않은 source 타입입니다."
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(InvalidRefTypeException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidRefType(
            InvalidRefTypeException ex, WebRequest request) {
        ApiErrorResponse errorResponse = createErrorResponse(
                "INVALID_REF_TYPE",
                "유효하지 않은 refType 타입입니다."
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneral(
            Exception ex, WebRequest request) {
        ApiErrorResponse errorResponse = createErrorResponse(
                "INTERNAL_ERROR",
                "시스템 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

    // === Private Helper Methods ===

    private ApiErrorResponse createErrorResponse(String code, String message) {
        String corr = MDC.get(CORR_KEY);
        return new ApiErrorResponse(code, message, corr, OffsetDateTime.now());
    }

    private String getRequestPath(WebRequest request) {
        try {
            String description = request.getDescription(false);
            if (description.startsWith("uri=")) {
                String path = description.substring(4);
                int queryIndex = path.indexOf('?');
                if (queryIndex > 0) {
                    path = path.substring(0, queryIndex);
                }
                return path;
            }
            return "/unknown";
        } catch (Exception e) {
            return "/unknown";
        }
    }
}