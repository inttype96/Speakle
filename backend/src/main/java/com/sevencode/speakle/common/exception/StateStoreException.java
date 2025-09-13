package com.sevencode.speakle.common.exception;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

/**
 * OAuth 상태 저장소 관련 예외
 */
@Getter
@Schema(description = "OAuth 상태 관리 관련 예외")
public class StateStoreException extends RuntimeException {

	private final StateStoreErrorType errorType;

	public StateStoreException(String message) {
		super(message);
		this.errorType = StateStoreErrorType.GENERAL;
	}

	public StateStoreException(String message, Throwable cause) {
		super(message, cause);
		this.errorType = StateStoreErrorType.GENERAL;
	}

	public StateStoreException(StateStoreErrorType errorType, String message) {
		super(message);
		this.errorType = errorType;
	}

	public StateStoreException(StateStoreErrorType errorType, String message, Throwable cause) {
		super(message, cause);
		this.errorType = errorType;
	}

	/**
	 * 팩토리 메서드들
	 */
	public static StateStoreException saveFailed(String message) {
		return new StateStoreException(StateStoreErrorType.SAVE_FAILED, message);
	}

	public static StateStoreException saveFailed(String message, Throwable cause) {
		return new StateStoreException(StateStoreErrorType.SAVE_FAILED, message, cause);
	}

	public static StateStoreException consumeFailed(String message) {
		return new StateStoreException(StateStoreErrorType.CONSUME_FAILED, message);
	}

	public static StateStoreException consumeFailed(String message, Throwable cause) {
		return new StateStoreException(StateStoreErrorType.CONSUME_FAILED, message, cause);
	}

	public static StateStoreException invalidState(String message) {
		return new StateStoreException(StateStoreErrorType.INVALID_STATE, message);
	}

	public static StateStoreException expiredState(String message) {
		return new StateStoreException(StateStoreErrorType.EXPIRED_STATE, message);
	}

	public static StateStoreException emptyInput(String message) {
		return new StateStoreException(StateStoreErrorType.EMPTY_INPUT, message);
	}

	public static StateStoreException redisConnectionError(String message, Throwable cause) {
		return new StateStoreException(StateStoreErrorType.REDIS_CONNECTION_ERROR, message, cause);
	}
}
