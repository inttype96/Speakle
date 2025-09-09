package com.sevencode.speakle.common.util;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.sevencode.speakle.common.exception.CryptoException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CryptoUtil {

	private static final String ALGORITHM = "AES";
	private static final String TRANSFORMATION = "AES/GCM/NoPadding";
	private static final int GCM_IV_LENGTH = 12;
	private static final int GCM_TAG_LENGTH = 16;

	private final SecretKeySpec secretKey;
	private final SecureRandom secureRandom;

	public CryptoUtil(@Value("${app.crypto.secret-key}") String secretKeyString) {
		// 32바이트 키 생성 (AES-256)
		byte[] key = secretKeyString.getBytes(StandardCharsets.UTF_8);
		if (key.length != 32) {
			throw new IllegalArgumentException("Secret key must be 32 bytes for AES-256");
		}
		this.secretKey = new SecretKeySpec(key, ALGORITHM);
		this.secureRandom = new SecureRandom();
	}

	/**
	 * 문자열을 AES-GCM으로 암호화
	 */
	public String encrypt(String plaintext) {
		if (plaintext == null || plaintext.isEmpty()) {
			throw CryptoException.emptyInput("암호화할 데이터가 비어있습니다.");
		}

		try {
			byte[] iv = new byte[GCM_IV_LENGTH];
			secureRandom.nextBytes(iv);

			Cipher cipher = Cipher.getInstance(TRANSFORMATION);
			GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
			cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

			byte[] encryptedData = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

			// IV + 암호화된 데이터를 결합하여 Base64 인코딩
			byte[] encryptedWithIv = new byte[GCM_IV_LENGTH + encryptedData.length];
			System.arraycopy(iv, 0, encryptedWithIv, 0, GCM_IV_LENGTH);
			System.arraycopy(encryptedData, 0, encryptedWithIv, GCM_IV_LENGTH, encryptedData.length);

			return Base64.getEncoder().encodeToString(encryptedWithIv);
		} catch (Exception e) {
			log.error("데이터 암호화에 실패했습니다. 원인: {}", e.getMessage());
			throw CryptoException.encryptionFailed("데이터 암호화에 실패했습니다.", e);
		}
	}

	/**
	 * AES-GCM으로 암호화된 문자열을 복호화
	 */
	public String decrypt(String encryptedText) {
		if (encryptedText == null || encryptedText.isEmpty()) {
			throw CryptoException.emptyInput("복호화할 데이터가 비어있습니다.");
		}

		try {
			byte[] decodedData = Base64.getDecoder().decode(encryptedText);

			if (decodedData.length < GCM_IV_LENGTH) {
				throw CryptoException.invalidData("암호화된 데이터 형식이 올바르지 않습니다.");
			}

			// IV와 암호화된 데이터 분리
			byte[] iv = new byte[GCM_IV_LENGTH];
			byte[] encryptedData = new byte[decodedData.length - GCM_IV_LENGTH];

			System.arraycopy(decodedData, 0, iv, 0, GCM_IV_LENGTH);
			System.arraycopy(decodedData, GCM_IV_LENGTH, encryptedData, 0, encryptedData.length);

			Cipher cipher = Cipher.getInstance(TRANSFORMATION);
			GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
			cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

			byte[] decryptedData = cipher.doFinal(encryptedData);
			return new String(decryptedData, StandardCharsets.UTF_8);
		} catch (IllegalArgumentException e) {
			log.error("잘못된 Base64 형식의 암호화 데이터: {}", e.getMessage());
			throw CryptoException.invalidData("암호화된 데이터 형식이 올바르지 않습니다.", e);
		} catch (Exception e) {
			log.error("데이터 복호화에 실패했습니다. 원인: {}", e.getMessage());
			throw CryptoException.decryptionFailed("데이터 복호화에 실패했습니다.", e);
		}
	}
}
