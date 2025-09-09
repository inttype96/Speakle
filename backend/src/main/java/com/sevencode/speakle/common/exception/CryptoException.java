package com.sevencode.speakle.common.exception;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

/**
 * 암호화/복호화 관련 예외
 */
@Getter
@Schema(description = "암호화 처리 관련 예외")
public class CryptoException extends RuntimeException {

	private final CryptoErrorType errorType;

	public CryptoException(String message) {
		super(message);
		this.errorType = CryptoErrorType.GENERAL;
	}

	public CryptoException(String message, Throwable cause) {
		super(message, cause);
		this.errorType = CryptoErrorType.GENERAL;
	}

	public CryptoException(CryptoErrorType errorType, String message) {
		super(message);
		this.errorType = errorType;
	}

	public CryptoException(CryptoErrorType errorType, String message, Throwable cause) {
		super(message, cause);
		this.errorType = errorType;
	}

	/**
	 * 팩토리 메서드들
	 */
	public static CryptoException encryptionFailed(String message) {
		return new CryptoException(CryptoErrorType.ENCRYPTION_FAILED, message);
	}

	public static CryptoException encryptionFailed(String message, Throwable cause) {
		return new CryptoException(CryptoErrorType.ENCRYPTION_FAILED, message, cause);
	}

	public static CryptoException decryptionFailed(String message) {
		return new CryptoException(CryptoErrorType.DECRYPTION_FAILED, message);
	}

	public static CryptoException decryptionFailed(String message, Throwable cause) {
		return new CryptoException(CryptoErrorType.DECRYPTION_FAILED, message, cause);
	}

	public static CryptoException invalidData(String message) {
		return new CryptoException(CryptoErrorType.INVALID_DATA, message);
	}

	public static CryptoException invalidData(String message, Throwable cause) {
		return new CryptoException(CryptoErrorType.INVALID_DATA, message, cause);
	}

	public static CryptoException emptyInput(String message) {
		return new CryptoException(CryptoErrorType.EMPTY_INPUT, message);
	}
}
