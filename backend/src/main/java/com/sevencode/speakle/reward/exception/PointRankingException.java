package com.sevencode.speakle.reward.exception;

/** 포인트 랭킹 조회 중 오류 발생 */
public class PointRankingException extends RuntimeException {
    public PointRankingException(String message) {
        super(message);
    }
}
