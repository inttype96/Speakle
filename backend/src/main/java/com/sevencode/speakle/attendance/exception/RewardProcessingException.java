package com.sevencode.speakle.attendance.exception;

/**
 * 출석체크 보상 처리 중 발생하는 예외
 */
public class RewardProcessingException extends AttendanceException {

    public RewardProcessingException(String message) {
        super("REWARD_PROCESSING_ERROR", message);
    }

    public RewardProcessingException(String message, Throwable cause) {
        super("REWARD_PROCESSING_ERROR", message, cause);
    }
}