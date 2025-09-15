package com.sevencode.speakle.parser.service.gms.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Message
 * - 역할: GMS(LLM 게이트웨이)에 전달되는 단일 대화 메시지 DTO.
 * - 필드:
 *   · role    : "system"/"developer"/"user"/"assistant" 등 역할
 *   · content : 메시지 본문 텍스트
 * - 직렬화: null 필드는 전송 시 제외(@JsonInclude.NON_NULL).
 *
 * 사용 예)
 *   new Message("developer", "You are an expert parser...");
 *   new Message("user", "You like to stand on the other side ...");
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Message {
	private String role;
	private String content;

	public Message() {
	}

	public Message(String role, String content) {
		this.role = role;
		this.content = content;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}
}
