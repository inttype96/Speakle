package com.sevencode.speakle.auth.service;

import com.sevencode.speakle.auth.dto.LoginRequest;
import com.sevencode.speakle.auth.dto.RefreshRequest;
import com.sevencode.speakle.auth.dto.TokenResponse;

public interface AuthService {
	TokenResponse login(LoginRequest req);

	TokenResponse refresh(RefreshRequest req);

	void logout(String refreshToken);
}