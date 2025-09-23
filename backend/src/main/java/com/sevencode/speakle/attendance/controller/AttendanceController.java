package com.sevencode.speakle.attendance.controller;

import com.sevencode.speakle.common.dto.ResponseWrapper;
import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.attendance.service.AttendanceService;
import com.sevencode.speakle.attendance.dto.response.AttendanceResponse;
import com.sevencode.speakle.attendance.dto.response.AttendanceStatsResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Attendance", description = "출석체크 관리 엔드포인트")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @Operation(
        summary = "출석 현황 조회",
        description = "현재 사용자의 출석 현황을 조회합니다. (오늘 출석 여부, 연속 출석일수 등)",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = {
            @ApiResponse(responseCode = "200", description = "성공", content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                {
                  "status": 200,
                  "message": "성공",
                  "data": {
                    "checkedToday": true,
                    "lastCheckDate": "2024-09-23",
                    "currentStreak": 5,
                    "totalAttendanceDays": 15,
                    "pointsEarnedToday": 10
                  }
                }
                """)
            )),
            @ApiResponse(responseCode = "401", description = "인증 필요")
        }
    )
    @GetMapping
    public ResponseEntity<ResponseWrapper<AttendanceResponse>> getAttendance(
            @AuthenticationPrincipal UserPrincipal user) {
        AttendanceResponse response = attendanceService.getUserAttendance(user.userId());
        return ResponseEntity.ok(ResponseWrapper.success(200, "성공", response));
    }

    @Operation(
        summary = "출석 통계 조회",
        description = "사용자의 상세 출석 통계를 조회합니다. (총 출석일수, 최대 연속일수, 이번 달 출석일수 등)",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = {
            @ApiResponse(responseCode = "200", description = "성공", content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                {
                  "status": 200,
                  "message": "성공",
                  "data": {
                    "totalAttendanceDays": 25,
                    "currentStreak": 5,
                    "maxStreak": 10,
                    "thisMonthAttendance": 8,
                    "firstAttendanceDate": "2024-08-01",
                    "lastAttendanceDate": "2024-09-23"
                  }
                }
                """)
            )),
            @ApiResponse(responseCode = "401", description = "인증 필요")
        }
    )
    @GetMapping("/stats")
    public ResponseEntity<ResponseWrapper<AttendanceStatsResponse>> getAttendanceStats(
            @AuthenticationPrincipal UserPrincipal user) {
        AttendanceStatsResponse response = attendanceService.getUserAttendanceStats(user.userId());
        return ResponseEntity.ok(ResponseWrapper.success(200, "성공", response));
    }
}