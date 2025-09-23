package com.sevencode.speakle.event.consumer;

import com.sevencode.speakle.event.dto.AttendanceCompletedEvent;
import com.sevencode.speakle.event.exception.EventProcessingException;
import com.sevencode.speakle.reward.service.RewardService;
import com.sevencode.speakle.reward.dto.request.RewardUpdateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PointsEventListener {

    private final RewardService rewardService;

    @Async("eventExecutor")
    @EventListener
    public void handleAttendanceCompletedEvent(AttendanceCompletedEvent event) {
        log.debug("Received AttendanceCompletedEvent for user: {} on {}, points: {}",
                 event.getUserId(), event.getAttendanceDate(), event.getPointsEarned());

        try {
            // 출석체크 포인트 지급
            RewardUpdateRequest rewardRequest = new RewardUpdateRequest(
                event.getUserId(),
                event.getPointsEarned(),
                "ATTENDANCE",      // SourceType enum 값
                "ATTENDANCE_DAYS", // RefType enum 값
                event.getUserId()  // refId로 userId 사용
            );

            rewardService.updateReward(rewardRequest, event.getUserId());

            log.info("Points awarded for attendance - User: {}, Date: {}, Points: {}, Streak: {}",
                    event.getUserId(), event.getAttendanceDate(),
                    event.getPointsEarned(), event.getStreakCount());

        } catch (Exception e) {
            log.error("Failed to award points for attendance - User: {}, Date: {}, Error: {}",
                     event.getUserId(), event.getAttendanceDate(), e.getMessage(), e);

            // 커스텀 예외로 래핑하여 상위로 전파
            throw new EventProcessingException(
                String.format("출석체크 포인트 지급 실패 - 사용자 ID: %d, 날짜: %s",
                             event.getUserId(), event.getAttendanceDate()),
                e
            );
        }
    }
}