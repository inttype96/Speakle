package com.sevencode.speakle.learn.exception;

/** 40X Not Found: 존재하지 않는 학습곡 */
public class LearnedSongNotFoundException extends RuntimeException {
    public LearnedSongNotFoundException(String message) {
        super(message);
    }
}