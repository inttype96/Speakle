package com.sevencode.speakle.learn.exception;

/** 한국어가 인식되어 음성 처리 시간이 초과되었습니다. 영어로 명확하게 발음해 주세요. */
public class ApiTimeoutException extends RuntimeException {
  public ApiTimeoutException(String message) {
    super(message);
  }
}
