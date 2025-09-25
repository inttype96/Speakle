package com.sevencode.speakle.learn.exception;

/** 40X Not Found: 존재하지 않는 회원 */
public class MemberNotFoundException extends RuntimeException {
    public MemberNotFoundException(String message) {
        super(message);
    }
}
