package com.sevencode.speakle.attendance.exception;

/**
 * 이미 출석체크가 완료된 경우 발생하는 예외
 */
public class AttendanceAlreadyProcessedException extends AttendanceException {

    public AttendanceAlreadyProcessedException(Long userId) {
        super("ATTENDANCE_ALREADY_PROCESSED",
              String.format("사용자 %d는 오늘 이미 출석체크를 완료했습니다.", userId));
    }
}