package com.sevencode.speakle.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Value("${gms.key}")
    private String apiKey;

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.getInterceptors().add((request, body, execution) -> {
            // GMS API 호출시에만 인증 헤더 추가
            if (request.getURI().toString().contains("gms.ssafy.io")) {
                request.getHeaders().add("Authorization", "Bearer " + apiKey);
            }
            return execution.execute(request, body);
        });
        return restTemplate;
    }

    // ObjectMapper는 Spring Boot가 자동으로 제공하므로 제거
    // @Bean
    // public ObjectMapper objectMapper() {
    //     return new ObjectMapper();
    // }
}