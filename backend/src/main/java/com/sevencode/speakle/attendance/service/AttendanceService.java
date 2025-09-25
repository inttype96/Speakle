package com.sevencode.speakle.attendance.service;

import com.sevencode.speakle.attendance.dto.response.AttendanceResponse;
import com.sevencode.speakle.attendance.dto.response.AttendanceStatsResponse;

public interface AttendanceService {

    /**
     * 자동 출석체크 (JWT 검증 시 호출)
     * @param userId 사용자 ID
     * @return 출석 성공 여부
     */
    boolean processAutoAttendance(Long userId);

    /**
     * 사용자 출석 현황 조회
     * @param userId 사용자 ID
     * @return 출석 현황
     */
    AttendanceResponse getUserAttendance(Long userId);

    /**
     * 사용자 출석 통계 조회
     * @param userId 사용자 ID
     * @return 출석 통계
     */
    AttendanceStatsResponse getUserAttendanceStats(Long userId);
}