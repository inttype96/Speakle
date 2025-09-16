package com.sevencode.speakle.member.service;

import com.sevencode.speakle.member.dto.request.MemberVerifyEmailRequest;

public interface MemberVerifyService {

	void sendVerificationCode(String email);

	void verifyEmail(MemberVerifyEmailRequest request);
}