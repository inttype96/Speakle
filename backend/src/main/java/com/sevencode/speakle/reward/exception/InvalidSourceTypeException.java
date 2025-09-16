package com.sevencode.speakle.reward.exception;

/** 유효하지 않은 SourceType 타입입니다 */
public class InvalidSourceTypeException extends RuntimeException {
  public InvalidSourceTypeException(String message) {
    super(message);
  }
}
