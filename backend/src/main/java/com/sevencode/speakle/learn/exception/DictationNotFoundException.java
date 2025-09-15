package com.sevencode.speakle.learn.exception;

/** 40X Not Found: 해당 딕테이션 문제를 찾을 수 없습니다. */
public class DictationNotFoundException extends RuntimeException {
  public DictationNotFoundException(String message) {
    super(message);
  }
}
