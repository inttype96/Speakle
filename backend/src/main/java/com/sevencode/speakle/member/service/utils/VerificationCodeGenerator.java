package com.sevencode.speakle.member.service.utils;

import java.security.SecureRandom;

import org.springframework.stereotype.Component;

@Component
public class VerificationCodeGenerator {

	private static final SecureRandom random = new SecureRandom();

	private VerificationCodeGenerator() {
	}

	/**
	 * 6자리 숫자 인증 코드 생성 (000000 ~ 999999)
	 */
	public static String generate() {
		return String.format("%06d", random.nextInt(1_000_000));
	}
}
