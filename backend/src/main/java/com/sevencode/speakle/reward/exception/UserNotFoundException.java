package com.sevencode.speakle.reward.exception;

/** 사용자를 찾을 수 없습니다. */
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }
}
