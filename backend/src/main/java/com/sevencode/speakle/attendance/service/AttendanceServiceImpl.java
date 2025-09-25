package com.sevencode.speakle.attendance.service;

import com.sevencode.speakle.attendance.dto.response.AttendanceResponse;
import com.sevencode.speakle.attendance.dto.response.AttendanceStatsResponse;
import com.sevencode.speakle.attendance.entity.AttendanceEntity;
import com.sevencode.speakle.attendance.repository.AttendanceRepository;
import com.sevencode.speakle.attendance.exception.AttendanceAlreadyProcessedException;
import com.sevencode.speakle.attendance.exception.AttendanceDataException;
import com.sevencode.speakle.attendance.exception.RewardProcessingException;
import com.sevencode.speakle.event.dto.AttendanceCompletedEvent;
import org.springframework.context.ApplicationEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private static final int ATTENDANCE_POINTS = 10;
    private static final String REDIS_ATTENDANCE_KEY = "attendance:checked:";

    private final AttendanceRepository attendanceRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final RedisTemplate<String, String> redisTemplate;

    @Override
    @Transactional
    public boolean processAutoAttendance(Long userId) {
        LocalDate today = LocalDate.now();
        String redisKey = REDIS_ATTENDANCE_KEY + userId + ":" + today;
        String lockKey = "attendance:lock:" + userId + ":" + today;

        // Redis 분산 락으로 동시 접근 방지 (5초 타임아웃)
        Boolean lockAcquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", 5, TimeUnit.SECONDS);
        if (!Boolean.TRUE.equals(lockAcquired)) {
            log.debug("Another attendance process is in progress for user {} on {}", userId, today);
            return false;
        }

        try {
            // Redis에서 오늘 출석 여부 확인
            if (redisTemplate.hasKey(redisKey)) {
                log.debug("User {} already checked attendance today: {}", userId, today);
                return false;
            }

            // DB에서 오늘 출석 여부 확인 (Redis 캐시 miss 대비)
            if (attendanceRepository.existsByUserIdAndLocalDate(userId, today)) {
                // Redis 캐시 갱신
                redisTemplate.opsForValue().set(redisKey, "1", 1, TimeUnit.DAYS);
                log.debug("User {} already checked attendance today (from DB): {}", userId, today);
                return false;
            }

            try {
                // 연속 출석일수 계산
                Integer streakCount = calculateStreakCount(userId, today);

                // 출석 기록 저장
                AttendanceEntity attendance = new AttendanceEntity(
                    userId,
                    today,
                    OffsetDateTime.now(),
                    streakCount,
                    ATTENDANCE_POINTS,
                    "AUTO"
                );
                attendance.setNote("출석체크"); // note 필드에 "출석체크" 설정

                AttendanceEntity savedAttendance;
                try {
                    savedAttendance = attendanceRepository.save(attendance);
                } catch (Exception e) {
                    throw new AttendanceDataException("출석체크 데이터 저장에 실패했습니다.", e);
                }

                // 출석 완료 이벤트 발행 (포인트 지급은 이벤트 리스너에서 처리)
                try {
                    AttendanceCompletedEvent event = AttendanceCompletedEvent.create(
                        userId,
                        today,
                        ATTENDANCE_POINTS,
                        streakCount,
                        "AUTO"
                    );
                    eventPublisher.publishEvent(event);
                    log.debug("Published AttendanceCompletedEvent for user {} on {}", userId, today);
                } catch (Exception e) {
                    throw new RewardProcessingException("출석체크 이벤트 발행에 실패했습니다.", e);
                }

                // Redis 캐시 설정 (하루 만료)
                redisTemplate.opsForValue().set(redisKey, "1", 1, TimeUnit.DAYS);

                log.info("Auto attendance processed for user {} on {}, streak: {}, points: {}",
                    userId, today, streakCount, ATTENDANCE_POINTS);
                return true;

            } catch (AttendanceDataException | RewardProcessingException e) {
                log.error("Failed to process auto attendance for user {} on {}: {}", userId, today, e.getMessage(), e);
                throw e; // 비즈니스 예외는 다시 던져서 상위에서 처리
            } catch (Exception e) {
                log.error("Unexpected error during attendance processing for user {} on {}: {}", userId, today, e.getMessage(), e);
                throw new AttendanceDataException("출석체크 처리 중 예상치 못한 오류가 발생했습니다.", e);
            }

        } finally {
            // 락 해제
            redisTemplate.delete(lockKey);
        }
    }

    @Override
    public AttendanceResponse getUserAttendance(Long userId) {
        LocalDate today = LocalDate.now();

        // 오늘 출석 여부
        boolean checkedToday = attendanceRepository.existsByUserIdAndLocalDate(userId, today);

        // 최근 출석 정보
        List<AttendanceEntity> recentAttendance = attendanceRepository.findByUserIdOrderByLocalDateDesc(userId);

        LocalDate lastCheckDate = null;
        Integer currentStreak = 0;
        Integer pointsEarnedToday = 0;

        if (!recentAttendance.isEmpty()) {
            AttendanceEntity latest = recentAttendance.get(0);
            lastCheckDate = latest.getLocalDate();
            currentStreak = latest.getStreakCount();

            if (checkedToday) {
                pointsEarnedToday = latest.getPointsEarned();
            }
        }

        // 총 출석일수
        Integer totalAttendanceDays = recentAttendance.size();

        return new AttendanceResponse(
            checkedToday,
            lastCheckDate,
            currentStreak,
            totalAttendanceDays,
            pointsEarnedToday
        );
    }

    @Override
    public AttendanceStatsResponse getUserAttendanceStats(Long userId) {
        List<AttendanceEntity> allAttendance = attendanceRepository.findByUserIdOrderByLocalDateDesc(userId);

        if (allAttendance.isEmpty()) {
            return new AttendanceStatsResponse(0, 0, 0, 0, null, null);
        }

        // 기본 통계
        Integer totalAttendanceDays = allAttendance.size();
        LocalDate firstAttendanceDate = allAttendance.get(allAttendance.size() - 1).getLocalDate();
        LocalDate lastAttendanceDate = allAttendance.get(0).getLocalDate();
        Integer currentStreak = allAttendance.get(0).getStreakCount();

        // 최대 연속 출석일수 계산
        Integer maxStreak = allAttendance.stream()
            .mapToInt(AttendanceEntity::getStreakCount)
            .max()
            .orElse(0);

        // 이번 달 출석일수
        YearMonth thisMonth = YearMonth.now();
        Integer thisMonthAttendance = (int) allAttendance.stream()
            .filter(a -> YearMonth.from(a.getLocalDate()).equals(thisMonth))
            .count();

        return new AttendanceStatsResponse(
            totalAttendanceDays,
            currentStreak,
            maxStreak,
            thisMonthAttendance,
            firstAttendanceDate,
            lastAttendanceDate
        );
    }

    private Integer calculateStreakCount(Long userId, LocalDate today) {
        LocalDate yesterday = today.minusDays(1);

        // 어제 출석 기록 확인
        return attendanceRepository.findByUserIdAndLocalDate(userId, yesterday)
            .map(attendance -> attendance.getStreakCount() + 1)
            .orElse(1); // 첫 출석이거나 연속이 끊어진 경우
    }
}
