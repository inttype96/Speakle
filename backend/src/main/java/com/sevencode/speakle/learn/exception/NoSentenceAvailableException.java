package com.sevencode.speakle.learn.exception;

/** 40X Not Found: 해당 학습 곡에서 추출할 문장이 없습니다. */
public class NoSentenceAvailableException extends RuntimeException {
    public NoSentenceAvailableException(String message) {
        super(message);
    }
}
