package com.sevencode.speakle.attendance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "attendance_days")
@IdClass(AttendanceId.class)
public class AttendanceEntity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "local_date")
    private LocalDate localDate;

    @Column(name = "checked_in_at", nullable = false)
    private OffsetDateTime checkedInAt;

    @Column(name = "streak_count")
    private Integer streakCount;

    @Column(name = "points_earned", nullable = false)
    private Integer pointsEarned;

    @Column(name = "source", length = 30)
    private String source;

    @Column(name = "note", length = 200)
    private String note;

    public AttendanceEntity(Long userId, LocalDate localDate, OffsetDateTime checkedInAt,
                           Integer streakCount, Integer pointsEarned, String source) {
        this.userId = userId;
        this.localDate = localDate;
        this.checkedInAt = checkedInAt;
        this.streakCount = streakCount;
        this.pointsEarned = pointsEarned;
        this.source = source;
    }
}