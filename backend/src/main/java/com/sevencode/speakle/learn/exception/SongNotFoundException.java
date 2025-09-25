package com.sevencode.speakle.learn.exception;

/** 40X Not Found: 해당 노래를 찾을 수 없습니다. */
public class SongNotFoundException extends RuntimeException {
    public SongNotFoundException(String message) {
        super(message);
    }
}
