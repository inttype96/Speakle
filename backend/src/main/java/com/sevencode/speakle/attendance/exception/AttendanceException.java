package com.sevencode.speakle.attendance.exception;

import lombok.Getter;

/**
 * 출석체크 비즈니스 로직 예외
 */
@Getter
public class AttendanceException extends RuntimeException {
    private final String code;

    public AttendanceException(String code, String message) {
        super(message);
        this.code = code;
    }

    public AttendanceException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

}
