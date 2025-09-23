package com.sevencode.speakle.attendance.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class AttendanceStatsResponse {
    private final Integer totalAttendanceDays;
    private final Integer currentStreak;
    private final Integer maxStreak;
    private final Integer thisMonthAttendance;
    private final LocalDate firstAttendanceDate;
    private final LocalDate lastAttendanceDate;
}