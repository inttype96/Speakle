package com.sevencode.speakle.event.consumer;

import com.sevencode.speakle.attendance.service.AttendanceService;
import com.sevencode.speakle.event.dto.UserLoginEvent;
import com.sevencode.speakle.event.exception.AttendanceProcessingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class AttendanceEventListener {

    private final AttendanceService attendanceService;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String DAILY_LOGIN_KEY = "daily:login:";

    @Async("eventExecutor")
    @EventListener
    public void handleUserLoginEvent(UserLoginEvent event) {
        log.debug("Received UserLoginEvent for user: {} from source: {}",
                 event.getUserId(), event.getSource());

        try {
            // 오늘 첫 로그인인지 확인
            LocalDate today = LocalDate.now();
            String dailyLoginKey = DAILY_LOGIN_KEY + event.getUserId() + ":" + today;

            // Redis에서 오늘 이미 로그인 처리했는지 확인
            Boolean alreadyProcessed = redisTemplate.hasKey(dailyLoginKey);

            if (alreadyProcessed) {
                log.debug("User {} already processed first login today", event.getUserId());
                return;
            }

            // 자동 출석체크 처리 (오늘 첫 로그인만)
            boolean attendanceProcessed = attendanceService.processAutoAttendance(event.getUserId());
            if (attendanceProcessed) {
                log.info("Auto attendance processed for user: {} from source: {}",
                        event.getUserId(), event.getSource());
            } else {
                log.debug("User {} already checked attendance today", event.getUserId());
            }

            // 오늘 첫 로그인 처리 완료 표시 (자정까지 유효)
            long secondsUntilMidnight = getSecondsUntilMidnight();
            redisTemplate.opsForValue().set(dailyLoginKey, "1", secondsUntilMidnight, TimeUnit.SECONDS);
            log.debug("Set daily login flag for user {} until midnight", event.getUserId());

        } catch (Exception e) {
            log.error("Failed to process auto attendance for user {} from source {}: {}",
                     event.getUserId(), event.getSource(), e.getMessage(), e);

            // 출석체크 실패는 로그인을 막지 않도록 예외를 다시 던지지 않음
            // throw를 제거하여 로그인 프로세스가 중단되지 않도록 함
        }
    }

    /**
     * 현재 시간부터 자정까지 남은 초 계산
     */
    private long getSecondsUntilMidnight() {
        LocalTime now = LocalTime.now();

        // 24:00:00 - 현재시간으로 계산
        long totalSecondsInDay = 24 * 60 * 60;
        long currentSeconds = now.toSecondOfDay();

        long secondsUntilMidnight = totalSecondsInDay - currentSeconds;

        // Redis setex 명령어는 0 이하의 값을 허용하지 않으므로 최소 1초 보장
        return Math.max(secondsUntilMidnight, 1L);
    }
}
