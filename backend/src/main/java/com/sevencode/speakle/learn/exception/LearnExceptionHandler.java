package com.sevencode.speakle.learn.exception;

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
@RestControllerAdvice(basePackages = "com.sevencode.speakle.learn")
public class LearnExceptionHandler {
    private static final String CORR_KEY = "corrId";

    @ExceptionHandler(LearnedSongNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleLearnedSongNotFound(
            LearnedSongNotFoundException ex, WebRequest request) {
        log.warn("학습곡 조회 실패 - 경로: {}", getRequestPath(request));

        ApiErrorResponse errorResponse = createErrorResponse(
                "LEARNED_SONG_NOT_FOUND",
                "존재하지 않는 학습곡입니다."
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ApiErrorResponse> handleUnauthorizedAccess(
            UnauthorizedAccessException ex, WebRequest request) {
        log.warn("권한 없는 접근 시도 - 경로: {}", getRequestPath(request));

        ApiErrorResponse errorResponse = createErrorResponse(
                "ACCESS_DENIED",
                "본인의 학습곡만 조회할 수 있습니다."
        );

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(NoSentenceAvailableException.class)
    public ResponseEntity<ApiErrorResponse> handleNoSentenceAvailable(
            NoSentenceAvailableException ex, WebRequest request) {
        log.warn("문장 조회 불가 - 경로: {}", getRequestPath(request));

        ApiErrorResponse errorResponse = createErrorResponse(
                "NO_SENTENCE_AVAILABLE",
                "해당 학습 곡에서 추출할 문장이 없습니다."
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }


    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneral(
            Exception ex, WebRequest request) {
        log.error("예상치 못한 오류 - 경로: {}, 타입: {}, 메시지: {}",
                getRequestPath(request), ex.getClass().getSimpleName(), ex.getMessage());

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
            log.debug("요청 경로 추출 실패: {}", e.getMessage());
            return "/unknown";
        }
    }
}
