package com.sevencode.speakle.learn.exception;

/** 404 Not Found: 해당 퀴즈를 찾을 수 없습니다. */
public class BlankNotFoundException extends RuntimeException {
    public BlankNotFoundException(String message) {
        super(message);
    }
}
