package com.sevencode.speakle.event.exception;

/**
 * 출석체크 처리 중 발생하는 예외
 */
public class AttendanceProcessingException extends EventException {

    public AttendanceProcessingException(String code, String message) {
        super(code, message);
    }

    public AttendanceProcessingException(String code, String message, Throwable cause) {
        super(code, message, cause);
    }
}