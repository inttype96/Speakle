package com.sevencode.speakle.learn.exception;

/** 404 Not Found: 해당 퀴즈 결과를 찾을 수 없습니다. */
public class BlankResultNotFoundException extends RuntimeException {
    public BlankResultNotFoundException(String message) {
        super(message);
    }
}
