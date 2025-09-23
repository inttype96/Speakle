package com.sevencode.speakle.event.consumer;

import com.sevencode.speakle.attendance.service.AttendanceService;
import com.sevencode.speakle.event.dto.UserLoginEvent;
import com.sevencode.speakle.event.exception.AttendanceProcessingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AttendanceEventListener {

    private final AttendanceService attendanceService;

    @Async("eventExecutor")
    @EventListener
    public void handleUserLoginEvent(UserLoginEvent event) {
        log.debug("Received UserLoginEvent for user: {} from source: {}",
                 event.getUserId(), event.getSource());

        try {
            boolean attendanceProcessed = attendanceService.processAutoAttendance(event.getUserId());
            if (attendanceProcessed) {
                log.info("Auto attendance processed for user: {} from source: {}",
                        event.getUserId(), event.getSource());
            } else {
                log.debug("User {} already checked attendance today", event.getUserId());
            }
        } catch (Exception e) {
            log.error("Failed to process auto attendance for user {} from source {}: {}",
                     event.getUserId(), event.getSource(), e.getMessage(), e);

            // 커스텀 예외로 래핑하여 상위로 전파
            throw new AttendanceProcessingException(
                "ATTENDANCE_PROCESSING_FAILED",
                String.format("출석체크 처리 실패 - 사용자 ID: %d, 소스: %s",
                             event.getUserId(), event.getSource()),
                e
            );
        }
    }
}