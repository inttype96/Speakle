package com.sevencode.speakle.learn.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EtriPronunciationResponse {
    @JsonProperty("request_id")
    private String requestId;

    private Integer result;

    @JsonProperty("return_type")
    private String returnType;

    @JsonProperty("return_object")
    private EtriReturnObject returnObject;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EtriReturnObject {
        private String recognized;
        private String score;
    }
}