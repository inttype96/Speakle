package com.sevencode.speakle.reward.exception;

/**  포인트 잔액이 부족합니다. */
public class InsufficientPointsException extends RuntimeException {
    public InsufficientPointsException(String message) {
        super(message);
    }
}
