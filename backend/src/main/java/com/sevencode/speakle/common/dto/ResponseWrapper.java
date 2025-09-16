package com.sevencode.speakle.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * 공통 API 응답 래퍼 클래스.
 * HTTP 응답 바디를 일정한 구조(status, message, data)로 감싸기 위해 사용합니다.
 * 2025-09-15, 09-08일 tkProj 채널에서 공유된 응답 템플릿을 기반으로 작성되었습니다.
 */
@Getter
@AllArgsConstructor
@Builder
public class ResponseWrapper<T> {
    private int status;
    private String message;
    private T data;

    /**
     * 성공 응답 생성.
     *
     * @param status  HTTP 상태 코드
     * @param message 응답 메시지
     * @param data    응답 데이터
     * @return ResponseWrapper 인스턴스
     */
    public static <T> ResponseWrapper<T> success(int status, String message, T data) {
        return ResponseWrapper.<T>builder()
                .status(status)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * 실패 응답 생성.
     *
     * @param status  HTTP 상태 코드
     * @param message 오류 메시지
     * @return ResponseWrapper 인스턴스 (data는 null)
     */
    public static <T> ResponseWrapper<T> fail(int status, String message) {
        return ResponseWrapper.<T>builder()
                .status(status)
                .message(message)
                .build();
    }
}
