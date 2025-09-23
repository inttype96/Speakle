package com.sevencode.speakle.attendance.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceId implements Serializable {
    private Long userId;
    private LocalDate localDate;
}