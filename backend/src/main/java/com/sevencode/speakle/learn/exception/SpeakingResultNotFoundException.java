package com.sevencode.speakle.learn.exception;

/** 40X Not Found: 스피킹 게임 결과를 찾을 수 없습니다. */
public class SpeakingResultNotFoundException extends RuntimeException {
  public SpeakingResultNotFoundException(String message) {
    super(message);
  }
}
