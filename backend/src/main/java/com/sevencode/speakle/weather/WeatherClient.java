package com.sevencode.speakle.weather;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class WeatherClient {

    private final RestTemplate restTemplate;

    @Value("${openweathermap.api.key:}")
    private String apiKey;

    @Value("${openweathermap.api.url:https://api.openweathermap.org/data/2.5/weather}")
    private String weatherApiUrl;

    public WeatherClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public WeatherData getCurrentWeather(String city) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Weather API key is not configured. Using default weather data.");
            return getDefaultWeather();
        }

        try {
            String url = String.format("%s?q=%s&appid=%s&units=metric", weatherApiUrl, city, apiKey);
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("weather")) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> weatherList = (java.util.List<Map<String, Object>>) response.get("weather");
                if (weatherList != null && !weatherList.isEmpty()) {
                    Map<String, Object> weather = weatherList.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> main = (Map<String, Object>) response.get("main");

                    return WeatherData.builder()
                            .condition((String) weather.get("main"))
                            .description((String) weather.get("description"))
                            .temperature(main != null ? ((Number) main.get("temp")).doubleValue() : 20.0)
                            .build();
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch weather data: {}", e.getMessage());
        }

        return getDefaultWeather();
    }

    private WeatherData getDefaultWeather() {
        return WeatherData.builder()
                .condition("Clear")
                .description("clear sky")
                .temperature(20.0)
                .build();
    }

    public static class WeatherData {
        private String condition;
        private String description;
        private Double temperature;

        public static WeatherDataBuilder builder() {
            return new WeatherDataBuilder();
        }

        public String getCondition() {
            return condition;
        }

        public String getDescription() {
            return description;
        }

        public Double getTemperature() {
            return temperature;
        }

        public static class WeatherDataBuilder {
            private String condition;
            private String description;
            private Double temperature;

            public WeatherDataBuilder condition(String condition) {
                this.condition = condition;
                return this;
            }

            public WeatherDataBuilder description(String description) {
                this.description = description;
                return this;
            }

            public WeatherDataBuilder temperature(Double temperature) {
                this.temperature = temperature;
                return this;
            }

            public WeatherData build() {
                WeatherData data = new WeatherData();
                data.condition = this.condition;
                data.description = this.description;
                data.temperature = this.temperature;
                return data;
            }
        }
    }
}