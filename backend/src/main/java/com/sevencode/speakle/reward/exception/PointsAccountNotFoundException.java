package com.sevencode.speakle.reward.exception;

/** 포인트 계정을 찾을 수 없습니다. */
public class PointsAccountNotFoundException extends RuntimeException {
    public PointsAccountNotFoundException(String message) {
        super(message);
    }
}
