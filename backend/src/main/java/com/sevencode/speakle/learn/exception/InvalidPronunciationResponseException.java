package com.sevencode.speakle.learn.exception;

/** 502 Bad Gateway: 발음 평가 서버 응답이 올바르지 않습니다. */
public class InvalidPronunciationResponseException extends RuntimeException {
    public InvalidPronunciationResponseException(String message) {
        super(message);
    }
}
