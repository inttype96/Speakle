package com.sevencode.speakle.event.exception;

import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
@Order(1)
@RestControllerAdvice(basePackages = "com.sevencode.speakle.event")
public class EventExceptionHandler {

	@ExceptionHandler(EventPublishException.class)
	public ResponseEntity<Map<String, Object>> handleEventPublish(
		EventPublishException ex, WebRequest request) {
		log.error("이벤트 발행 실패 - 경로: {}, 오류: {}", getRequestPath(request), ex.getMessage());

		Map<String, Object> errorResponse = Map.of(
			"code", ex.getCode(),
			"message", "이벤트 발행 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
			"status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
			"path", getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
	}

	@ExceptionHandler(EventSerializationException.class)
	public ResponseEntity<Map<String, Object>> handleEventSerialization(
		EventSerializationException ex, WebRequest request) {
		log.error("이벤트 직렬화 실패 - 경로: {}, 오류: {}", getRequestPath(request), ex.getMessage());

		Map<String, Object> errorResponse = Map.of(
			"code", ex.getCode(),
			"message", "데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
			"status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
			"path", getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
	}

	@ExceptionHandler(MessageDeserializationException.class)
	public ResponseEntity<Map<String, Object>> handleMessageDeserialization(
		MessageDeserializationException ex, WebRequest request) {
		log.error("메시지 역직렬화 실패 - 경로: {}, 오류: {}", getRequestPath(request), ex.getMessage());

		Map<String, Object> errorResponse = Map.of(
			"code", ex.getCode(),
			"message", "메시지 처리 중 오류가 발생했습니다.",
			"status", HttpStatus.BAD_REQUEST.value(),
			"path", getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
	}

	@ExceptionHandler(InvalidMessageFormatException.class)
	public ResponseEntity<Map<String, Object>> handleInvalidMessageFormat(
		InvalidMessageFormatException ex, WebRequest request) {
		log.error("잘못된 메시지 형식 - 경로: {}, 오류: {}", getRequestPath(request), ex.getMessage());

		Map<String, Object> errorResponse = Map.of(
			"code", ex.getCode(),
			"message", "메시지 형식이 올바르지 않습니다.",
			"status", HttpStatus.BAD_REQUEST.value(),
			"path", getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
	}

	@ExceptionHandler(EventProcessingException.class)
	public ResponseEntity<Map<String, Object>> handleEventProcessing(
		EventProcessingException ex, WebRequest request) {
		log.error("이벤트 처리 실패 - 경로: {}, 오류: {}", getRequestPath(request), ex.getMessage());

		Map<String, Object> errorResponse = Map.of(
			"code", ex.getCode(),
			"message", "이벤트 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
			"status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
			"path", getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
	}

	@ExceptionHandler(EventAcknowledgmentException.class)
	public ResponseEntity<Map<String, Object>> handleEventAcknowledgment(
		EventAcknowledgmentException ex, WebRequest request) {
		log.error("이벤트 확인응답 실패 - 경로: {}, 오류: {}", getRequestPath(request), ex.getMessage());

		Map<String, Object> errorResponse = Map.of(
			"code", ex.getCode(),
			"message", "이벤트 확인 처리 중 오류가 발생했습니다.",
			"status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
			"path", getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
	}

	@ExceptionHandler(EventException.class)
	public ResponseEntity<Map<String, Object>> handleGenericEvent(
		EventException ex, WebRequest request) {
		log.error("이벤트 서비스 오류 - 경로: {}, 오류: {}", getRequestPath(request), ex.getMessage());

		Map<String, Object> errorResponse = Map.of(
			"code", ex.getCode(),
			"message", "이벤트 서비스 이용 중 오류가 발생했습니다. 문제가 지속되면 고객지원팀에 문의해 주세요.",
			"status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
			"path", getRequestPath(request)
		);

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
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