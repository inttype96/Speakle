package com.sevencode.speakle.social.spotify.service;

import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
public class CryptoService {
	public String encrypt(String plain) {
		return Base64.getEncoder().encodeToString(plain.getBytes());
	}

	public String decrypt(String enc) {
		return new String(Base64.getDecoder().decode(enc));
	}
}