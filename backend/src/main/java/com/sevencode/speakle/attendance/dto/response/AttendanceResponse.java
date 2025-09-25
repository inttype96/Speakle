package com.sevencode.speakle.attendance.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class AttendanceResponse {
    private final boolean checkedToday;
    private final LocalDate lastCheckDate;
    private final Integer currentStreak;
    private final Integer totalAttendanceDays;
    private final Integer pointsEarnedToday;
}