package com.sevencode.speakle.event.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class AttendanceCompletedEvent {
    private final Long userId;
    private final LocalDate attendanceDate;
    private final Integer pointsEarned;
    private final Integer streakCount;
    private final String source;
    private final LocalDateTime occurredAt;

    public static AttendanceCompletedEvent create(Long userId, LocalDate attendanceDate,
                                                Integer pointsEarned, Integer streakCount, String source) {
        return new AttendanceCompletedEvent(
            userId,
            attendanceDate,
            pointsEarned,
            streakCount,
            source,
            LocalDateTime.now()
        );
    }
}