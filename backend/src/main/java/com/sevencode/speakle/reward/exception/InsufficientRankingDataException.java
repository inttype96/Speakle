package com.sevencode.speakle.reward.exception;

/** 랭킹 데이터가 충분하지 않을 때 발생하는 예외 */
public class InsufficientRankingDataException extends RuntimeException {
    public InsufficientRankingDataException(String message) {
        super(message);
    }
}
