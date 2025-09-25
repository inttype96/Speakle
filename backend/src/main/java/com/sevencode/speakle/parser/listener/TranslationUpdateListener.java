package com.sevencode.speakle.parser.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sevencode.speakle.parser.dto.TranslationUpdateEvent;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TranslationUpdateListener implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(@NonNull Message message, byte[] pattern) {
        try {
            String messageBody = new String(message.getBody());
            log.debug("[TranslationUpdateListener] 메시지 수신: {}", messageBody);

            // JSON을 TranslationUpdateEvent로 파싱
            TranslationUpdateEvent event = objectMapper.readValue(messageBody, TranslationUpdateEvent.class);

            // WebSocket으로 특정 songId 구독자들에게 브로드캐스트
            String destination = "/topic/translation/" + event.getSongId();
            messagingTemplate.convertAndSend(destination, event);

            log.debug("[TranslationUpdateListener] WebSocket 메시지 전송 완료 - destination={}, status={}, 진행률: {}/{}",
                    destination, event.getStatus(), event.getCompletedChunks(), event.getTotalChunks());

        } catch (Exception e) {
            log.error("[TranslationUpdateListener] 메시지 처리 실패 - error={}", e.getMessage(), e);
        }
    }
}
