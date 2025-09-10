package com.sevencode.speakle.learn.exception;

/** 404? NOT FOUND: 해당 학습 곡에서 추출할 문장이 없습니다. */
public class NoRecommendationSentenceFoundException extends RuntimeException {
    public NoRecommendationSentenceFoundException(String message) {
        super(message);
    }
}