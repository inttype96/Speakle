package com.sevencode.speakle.reward.exception;

/** 유효하지 않은 refType 타입입니다 */
public class InvalidRefTypeException extends RuntimeException {
    public InvalidRefTypeException(String message) {
        super(message);
    }
}
