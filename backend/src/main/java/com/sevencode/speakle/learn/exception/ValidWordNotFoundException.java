package com.sevencode.speakle.learn.exception;

/** 404 Not Found: 빈칸으로 만들 적절한 단어를 찾을 수 없습니다. */
public class ValidWordNotFoundException extends RuntimeException {
    public ValidWordNotFoundException(String message) {
        super(message);
    }
}
