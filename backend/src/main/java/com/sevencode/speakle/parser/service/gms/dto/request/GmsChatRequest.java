package com.sevencode.speakle.parser.service.gms.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sevencode.speakle.parser.service.gms.dto.response.ResponseFormat;

import java.util.List;

/**
 * GmsChatRequest
 * - 목적: LLM 게이트웨이(GMS)에 전달할 채팅 요청 DTO.
 * - 필드:
 *   · model           : 모델명 (예: "gpt-4o-mini")
 *   · max_tokens      : 응답 토큰 상한
 *   · temperature     : 생성 다양성(낮을수록 결정적)
 *   · user            : 호출자 식별(감사/레이트리밋 분리용)
 *   · response_format : 응답 포맷 강제(예: JSON 스키마). 필요 없으면 null
 *   · messages        : 대화 메시지 배열(순서 중요: developer → user …)
 *
 * 사용 예)
 *   GmsChatRequest r = new GmsChatRequest();
 *   r.setModel("gpt-4o-mini");
 *   r.setMax_tokens(1500);
 *   r.setTemperature(0.2);
 *   r.setUser("service:parsing");
 *   r.setMessages(List.of(new Message("developer", "..."), new Message("user", "...")));
 *   // 스키마가 필요하면 ResponseFormat 설정
 *
 * 직렬화: null 필드는 전송에서 제외(@JsonInclude.NON_NULL).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GmsChatRequest {
	private String model;                 // e.g. "gpt-4o-mini"
	private Integer max_tokens;           // 응답 토큰 상한
	private Double temperature;           // 생성 다양성
	private String user;                  // 호출자 식별(벤더 추적/레이트리밋)
	private ResponseFormat response_format; // 선택 사용(스키마 강제)
	private List<Message> messages;       // 대화 메시지 배열

	/* getter/setter */
	public String getModel() {
		return model;
	}

	public void setModel(String model) {
		this.model = model;
	}

	public Integer getMax_tokens() {
		return max_tokens;
	}

	public void setMax_tokens(Integer max_tokens) {
		this.max_tokens = max_tokens;
	}

	public Double getTemperature() {
		return temperature;
	}

	public void setTemperature(Double temperature) {
		this.temperature = temperature;
	}

	public String getUser() {
		return user;
	}

	public void setUser(String user) {
		this.user = user;
	}

	public ResponseFormat getResponse_format() {
		return response_format;
	}

	public void setResponse_format(ResponseFormat response_format) {
		this.response_format = response_format;
	}

	public List<Message> getMessages() {
		return messages;
	}

	public void setMessages(List<Message> messages) {
		this.messages = messages;
	}
}
