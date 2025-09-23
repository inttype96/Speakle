package com.sevencode.speakle.event.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class UserLoginEvent {
    private final Long userId;
    private final String username;
    private final LocalDateTime loginTime;
    private final String source; // "JWT_VERIFICATION", "LOGIN_API" 등

    public static UserLoginEvent fromJwtVerification(Long userId, String username) {
        return new UserLoginEvent(userId, username, LocalDateTime.now(), "JWT_VERIFICATION");
    }
}