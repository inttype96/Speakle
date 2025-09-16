package com.sevencode.speakle.learn.exception;

/** 404 Not Found: 딕테이션 퀴즈 결과를 찾을 수 없습니다. */
public class DictationResultNotFoundException extends RuntimeException {
    public DictationResultNotFoundException(String message) {
        super(message);
    }
}
