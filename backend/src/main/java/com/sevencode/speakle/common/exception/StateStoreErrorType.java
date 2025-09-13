package com.sevencode.speakle.common.exception;

import lombok.Getter;

/**
 * 상태 저장소 오류 유형
 */
@Getter
public enum StateStoreErrorType {
	SAVE_FAILED("상태 저장 실패"),
	CONSUME_FAILED("상태 소비 실패"),
	INVALID_STATE("잘못된 상태값"),
	EXPIRED_STATE("만료된 상태값"),
	REDIS_CONNECTION_ERROR("Redis 연결 오류"),
	EMPTY_INPUT("입력값 없음"),
	GENERAL("일반 오류");

	private final String description;

	StateStoreErrorType(String description) {
		this.description = description;
	}

}
