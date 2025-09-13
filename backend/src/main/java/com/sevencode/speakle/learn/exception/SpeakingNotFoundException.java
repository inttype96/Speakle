package com.sevencode.speakle.learn.exception;

/** 40X Not Found: 해당 스피킹 문제를 찾을 수 없습니다. */
public class SpeakingNotFoundException extends RuntimeException {
  public SpeakingNotFoundException(String message) {
    super(message);
  }
}
