package com.sevencode.speakle.social.spotify.service;

import com.sevencode.speakle.member.domain.Member;

public interface SpotifyOauthService {
	/** 엔트리: state 발급 + authorize URL 조립 */
	String entry();

	/** 콜백 처리: state 검증, code 교환, /v1/me, 회원 매칭/생성 + 토큰 저장 → 최종 Member 반환 */
	Member callback(String code, String state);
}