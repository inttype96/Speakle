package com.sevencode.speakle.attendance.exception;

/**
 * 출석체크 데이터 처리 중 발생하는 예외
 */
public class AttendanceDataException extends AttendanceException {

    public AttendanceDataException(String message) {
        super("ATTENDANCE_DATA_ERROR", message);
    }

    public AttendanceDataException(String message, Throwable cause) {
        super("ATTENDANCE_DATA_ERROR", message, cause);
    }
}