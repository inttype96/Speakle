package com.sevencode.speakle.learn.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlankResultResponse {
    private Long blankResultId;
    private Long userId;
    private Long blankId;
    private Boolean isCorrect;
    private Integer score;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime createdAt;

    private Map<String, Object> meta;
}
