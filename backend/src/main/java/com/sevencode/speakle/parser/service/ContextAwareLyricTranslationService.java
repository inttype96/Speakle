package com.sevencode.speakle.parser.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sevencode.speakle.song.domain.LyricChunk;
import com.sevencode.speakle.song.repository.LyricChunkRepository;
import com.sevencode.speakle.parser.dto.TranslationUpdateEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContextAwareLyricTranslationService {

    private final LyricsParsingService lyricsParsingService;
    private final LyricChunkRepository lyricChunkRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    // 현재 진행 중인 번역 작업 추적 (메모리 기반)
    private final Set<String> activeTranslations = ConcurrentHashMap.newKeySet();

    private static final String REDIS_PREFIX = "lyrics:translation:";
    private static final String REDIS_PUBSUB_CHANNEL = "translation:updates";
    private static final int REDIS_TTL_HOURS = 24;

    /**
     * 곡의 모든 청크를 컨텍스트 기반으로 실시간 번역
     * 번역이 완료되는 대로 Redis PubSub으로 실시간 알림
     */
    public void translateSongChunksRealtime(String songId, String title, String artists, String album) {
        log.info("[ContextAwareLyricTranslation] 실시간 번역 시작 - songId={}, title={}, artists={}", songId, title, artists);

        // 중복 요청 방지
        if (!activeTranslations.add(songId)) {
            log.info("⚠️ [중복 요청 차단] 이미 진행 중인 번역 - songId={}", songId);
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                // 1. 기존 청크 조회
                List<LyricChunk> chunks = lyricChunkRepository.findBySongSongIdOrderByStartTimeMsAsc(songId);
                if (chunks.isEmpty()) {
                    log.warn("[ContextAwareLyricTranslation] 청크가 없음 - songId={}", songId);
                    publishTranslationEvent(songId, null, TranslationUpdateEvent.TranslationStatus.ERROR, 0, 0);
                    return;
                }

                // 2. 번역 필요한 청크 필터링 (영어는 있고 한국어는 없는 것들만)
                List<LyricChunk> targetChunks = chunks.stream()
                        .filter(c -> isNotBlank(c.getEnglish()) && isBlank(c.getKorean()))
                        .toList();

                // 이미 번역된 청크 수 계산
                int alreadyTranslatedCount = (int) chunks.stream()
                        .filter(c -> isNotBlank(c.getEnglish()) && isNotBlank(c.getKorean()))
                        .count();

                log.info("[ContextAwareLyricTranslation] 번역 대상 청크 수: {} / 전체: {}", targetChunks.size(), chunks.size());

                if (targetChunks.isEmpty()) {
                    log.info("[ContextAwareLyricTranslation] 모든 번역 완료됨 - songId={}, 총 {}개 청크", songId, alreadyTranslatedCount);
                    publishTranslationEvent(songId, null, TranslationUpdateEvent.TranslationStatus.COMPLETED, alreadyTranslatedCount, alreadyTranslatedCount);
                    return;
                }

                // 3. 번역 시작 이벤트 발송
                publishTranslationEvent(songId, null, TranslationUpdateEvent.TranslationStatus.STARTED, targetChunks.size(), 0);

                // 4. 순차적 번역 (실시간 피드백을 위해)
                int completedCount = 0;
                for (LyricChunk chunk : targetChunks) {
                    try {
                        translateSingleChunkSync(chunk, title, artists, album, songId, targetChunks.size(), ++completedCount);

                        // 개별 청크 완료 시 DB 저장
                        if (isNotBlank(chunk.getKorean())) {
                            lyricChunkRepository.save(chunk);
                        }

                    } catch (Exception e) {
                        log.error("[ContextAwareLyricTranslation] 청크 번역 실패 - chunkId={}, error={}", chunk.getSongsLyricsId(), e.getMessage());
                    }
                }

                // 5. 전체 완료 이벤트 발송
                publishTranslationEvent(songId, null, TranslationUpdateEvent.TranslationStatus.COMPLETED, targetChunks.size(), completedCount);
                log.info("[ContextAwareLyricTranslation] 실시간 번역 완료 - songId={}, 완료: {}/{}", songId, completedCount, targetChunks.size());

            } catch (Exception e) {
                log.error("[ContextAwareLyricTranslation] 실시간 번역 실패 - songId={}, error={}", songId, e.getMessage(), e);
                publishTranslationEvent(songId, null, TranslationUpdateEvent.TranslationStatus.ERROR, 0, 0);
            } finally {
                // 완료/실패 시 activeTranslations에서 제거
                activeTranslations.remove(songId);
            }
        });
    }

    /**
     * 실시간 개별 청크 번역 (동기적)
     */
    private void translateSingleChunkSync(LyricChunk chunk, String title, String artists, String album,
                                         String songId, int totalChunks, int completedCount) {
        String englishText = chunk.getEnglish().trim();
        if (englishText.isEmpty()) {
            return; // 빈 청크 스킵
        }

        String cacheKey = REDIS_PREFIX + chunk.getSongsLyricsId();

        try {
            // Redis 캐시 확인
            String cachedTranslation = redisTemplate.opsForValue().get(cacheKey);
            if (isNotBlank(cachedTranslation)) {
                chunk.setKorean(cachedTranslation);
                // 캐시 히트도 진행 상황 알림
                publishTranslationEventWithChunk(songId, chunk, TranslationUpdateEvent.TranslationStatus.PROGRESS, totalChunks, completedCount);
                return;
            }

            // GPT 번역 요청 (실제 API 호출)
            log.info("🔥 [GPT API 호출] chunkId={}, text={}", chunk.getSongsLyricsId(), englishText.substring(0, Math.min(30, englishText.length())));
            String translatedText = requestTranslationFromGPT(englishText, title, artists, album);
            if (isNotBlank(translatedText)) {
                log.info("✅ [GPT API 응답] chunkId={}, translation={}", chunk.getSongsLyricsId(), translatedText.substring(0, Math.min(30, translatedText.length())));
                chunk.setKorean(translatedText);

                // Redis에 캐시 저장
                redisTemplate.opsForValue().set(cacheKey, translatedText, Duration.ofHours(REDIS_TTL_HOURS));

                // 실시간 번역 완료 이벤트 발송
                publishTranslationEventWithChunk(songId, chunk, TranslationUpdateEvent.TranslationStatus.PROGRESS, totalChunks, completedCount);

                log.debug("[ContextAwareLyricTranslation] 번역 완료 - chunkId={}, text={}",
                        chunk.getSongsLyricsId(), translatedText.substring(0, Math.min(20, translatedText.length())));
            }

        } catch (Exception e) {
            log.error("[ContextAwareLyricTranslation] 청크 번역 실패 - chunkId={}, error={}",
                    chunk.getSongsLyricsId(), e.getMessage());
        }
    }

    /**
     * Redis PubSub으로 번역 이벤트 발송
     */
    private void publishTranslationEvent(String songId, LyricChunk chunk, TranslationUpdateEvent.TranslationStatus status,
                                        int totalChunks, int completedChunks) {
        try {
            TranslationUpdateEvent event = TranslationUpdateEvent.builder()
                    .songId(songId)
                    .chunkId(chunk != null ? chunk.getSongsLyricsId() : null)
                    .english(chunk != null ? chunk.getEnglish() : null)
                    .korean(chunk != null ? chunk.getKorean() : null)
                    .startTimeMs(chunk != null ? chunk.getStartTimeMs() : null)
                    .totalChunks(totalChunks)
                    .completedChunks(completedChunks)
                    .status(status)
                    .build();

            String eventJson = objectMapper.writeValueAsString(event);
            redisTemplate.convertAndSend(REDIS_PUBSUB_CHANNEL, eventJson);

            log.debug("[ContextAwareLyricTranslation] 이벤트 발송 - songId={}, status={}, 진행률: {}/{}",
                    songId, status, completedChunks, totalChunks);

        } catch (Exception e) {
            log.error("[ContextAwareLyricTranslation] 이벤트 발송 실패 - songId={}, error={}", songId, e.getMessage());
        }
    }

    /**
     * 청크 정보 포함 번역 이벤트 발송
     */
    private void publishTranslationEventWithChunk(String songId, LyricChunk chunk, TranslationUpdateEvent.TranslationStatus status,
                                                 int totalChunks, int completedChunks) {
        publishTranslationEvent(songId, chunk, status, totalChunks, completedChunks);
    }

    /**
     * GPT에게 컨텍스트 정보를 포함하여 번역 요청
     */
    private String requestTranslationFromGPT(String englishText, String title, String artists, String album) {
        try {
            String contextPrompt = buildContextPrompt(title, artists, album, englishText);

            return Objects.requireNonNull(lyricsParsingService.translateOnlyLines(List.of(englishText))
					.timeout(Duration.ofSeconds(10))
					.onErrorReturn(List.of(""))
					.block())
                    .stream()
                    .findFirst()
                    .orElse("");

        } catch (Exception e) {
            log.error("[ContextAwareLyricTranslation] GPT 번역 요청 실패 - text={}, error={}", englishText, e.getMessage());
            return "";
        }
    }

    /**
     * 컨텍스트 포함 프롬프트 생성
     */
    private String buildContextPrompt(String title, String artists, String album, String englishText) {
        return String.format(
                "이것은 %s의 '%s' (앨범: %s)라는 곡의 가사 일부입니다. " +
                "당신은 이미 이 곡을 알고 있을 것입니다. " +
                "곡의 분위기와 스타일을 고려하여 다음 영어 가사를 자연스러운 한국어로 번역해주세요: %s",
                artists, title, album, englishText
        );
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

    private boolean isNotBlank(String str) {
        return !isBlank(str);
    }
}
