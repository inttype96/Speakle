package com.sevencode.speakle.learn.exception;

/** 40X Forbidden: 접근할 수 있는 권한이 없습니다. */
public class UnauthorizedAccessException extends RuntimeException {
    public UnauthorizedAccessException(String message) {
        super(message);
    }
}
