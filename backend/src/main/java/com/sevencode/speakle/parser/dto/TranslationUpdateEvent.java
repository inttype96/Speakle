package com.sevencode.speakle.parser.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TranslationUpdateEvent {
    private String songId;
    private String chunkId;
    private String english;
    private String korean;
    private Long startTimeMs;
    private int totalChunks;
    private int completedChunks;
    private TranslationStatus status;

    public enum TranslationStatus {
        STARTED,    // 번역 시작
        PROGRESS,   // 진행 중 (개별 청크 완료)
        COMPLETED,  // 전체 완료
        ERROR       // 오류 발생
    }
}