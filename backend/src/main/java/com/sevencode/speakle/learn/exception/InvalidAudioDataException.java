package com.sevencode.speakle.learn.exception;

/** 유효하지 않은 오디오 데이터입니다. */
public class InvalidAudioDataException extends RuntimeException {
    public InvalidAudioDataException(String message) {
        super(message);
    }
}
