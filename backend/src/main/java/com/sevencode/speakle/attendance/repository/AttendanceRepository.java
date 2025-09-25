package com.sevencode.speakle.attendance.repository;

import com.sevencode.speakle.attendance.entity.AttendanceEntity;
import com.sevencode.speakle.attendance.entity.AttendanceId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceEntity, AttendanceId> {

    boolean existsByUserIdAndLocalDate(Long userId, LocalDate localDate);

    @Query("SELECT a FROM AttendanceEntity a WHERE a.userId = :userId ORDER BY a.localDate DESC")
    List<AttendanceEntity> findByUserIdOrderByLocalDateDesc(@Param("userId") Long userId);

    @Query("SELECT a FROM AttendanceEntity a WHERE a.userId = :userId AND a.localDate = :date")
    Optional<AttendanceEntity> findByUserIdAndLocalDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT a FROM AttendanceEntity a WHERE a.userId = :userId AND a.localDate >= :fromDate ORDER BY a.localDate DESC")
    List<AttendanceEntity> findRecentAttendance(@Param("userId") Long userId, @Param("fromDate") LocalDate fromDate);

    @Query("SELECT COUNT(a) FROM AttendanceEntity a WHERE a.userId = :userId AND a.localDate >= :fromDate")
    long countAttendanceDays(@Param("userId") Long userId, @Param("fromDate") LocalDate fromDate);
}