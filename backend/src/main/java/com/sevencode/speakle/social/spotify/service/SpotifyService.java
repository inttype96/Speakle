package com.sevencode.speakle.social.spotify.service;

import com.sevencode.speakle.social.spotify.dto.request.SpotifyConnectRequest;
import com.sevencode.speakle.social.spotify.dto.response.SpotifyAccountInfoResponse;

public interface SpotifyService {

	/** 계정 연결: authorization code → 토큰 교환 후 저장 */
	SpotifyAccountInfoResponse connect(Long userId, SpotifyConnectRequest req);

	/** 계정 해제: 토큰/연결정보 제거 */
	void disconnect(Long userId);

	/** 연결 정보 조회 */
	SpotifyAccountInfoResponse getInfo(Long userId);

	/** 저장된 refresh_token_enc로 액세스 토큰 재발급 */
	SpotifyAccountInfoResponse refreshAccessToken(Long userId);
}