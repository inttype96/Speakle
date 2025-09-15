package com.sevencode.speakle.learn.exception;

/** 50X: 발음 평가 서버 호출에 실패했습니다.(네트워크/타임아웃) */
public class PronunciationServerException extends RuntimeException {
    public PronunciationServerException(String message) {
        super(message);
    }
}
