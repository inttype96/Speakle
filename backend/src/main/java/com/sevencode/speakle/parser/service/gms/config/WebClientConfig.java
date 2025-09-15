package com.sevencode.speakle.parser.service.gms.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.netty.http.client.HttpClient;

/**
 * WebClientConfig
 * - 목적: GMS(LLM 게이트웨이) 호출용 WebClient/ObjectMapper 빈 구성.
 * - 포인트:
 *   · responseTimeout은 MVC async timeout보다 짧게(예: 110s < 120s).
 *   · Netty Read/WriteTimeoutHandler로 소켓 레벨 가드.
 *   · 대용량 JSON 대비 maxInMemorySize 조정.
 *   · Authorization 헤더 기본 세팅(Bearer {key}).
 */
@Configuration
@EnableConfigurationProperties(GmsProperties.class)
public class WebClientConfig {

	/**
	 * GMS 호출 WebClient
	 * - baseUrl: props.url()
	 * - Authorization: Bearer 토큰 자동 부착
	 * - Netty 타임아웃: connect 10s, read/write = responseTimeout
	 * - 메모리 버퍼: props.maxInMemorySize()
	 */
	@Bean
	public WebClient gmsWebClient(GmsProperties props) {
		var d = props.responseTimeout(); // 예: PT110S (MVC 120s보다 짧게 권장)
		HttpClient httpClient = HttpClient.create()
			.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10_000)
			.responseTimeout(d)
			.doOnConnected(conn -> conn
				.addHandlerLast(new ReadTimeoutHandler((int)d.toSeconds()))
				.addHandlerLast(new WriteTimeoutHandler((int)d.toSeconds())));

		return WebClient.builder()
			.baseUrl(props.url())
			.clientConnector(new ReactorClientHttpConnector(httpClient))
			.defaultHeader("Authorization", "Bearer " + props.key())
			.defaultHeader("Content-Type", "application/json")
			.exchangeStrategies(ExchangeStrategies.builder()
				.codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(props.maxInMemorySize()))
				.build())
			.build();
	}

	/**
	 * ObjectMapper (게이트웨이 응답 파싱용)
	 * - FAIL_ON_UNKNOWN_PROPERTIES=false: 유연 파싱(스키마 변동 내성)
	 */
	@Bean
	public ObjectMapper objectMapper() {
		return new ObjectMapper()
			.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
	}
}
