package com.sevencode.speakle.learn.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EtriPronunciationRequest {
    @JsonProperty("request_id")
    private String requestId;

    private EtriArgument argument;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EtriArgument {
        @JsonProperty("language_code")
        private String languageCode;
        private String script;
        private String audio;
    }
}