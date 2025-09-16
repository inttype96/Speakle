package com.sevencode.speakle.member.service;

import org.springframework.stereotype.Service;

import com.sevencode.speakle.common.service.VerificationCodeStore;
import com.sevencode.speakle.member.dto.request.MemberVerifyEmailRequest;
import com.sevencode.speakle.member.exception.DuplicateEmailException;
import com.sevencode.speakle.member.exception.InvalidVerificationCodeException;
import com.sevencode.speakle.member.exception.MemberNotFoundException;
import com.sevencode.speakle.member.repository.SpringDataMemberJpa;
import com.sevencode.speakle.member.service.utils.EmailSender;
import com.sevencode.speakle.member.service.utils.VerificationCodeGenerator;
import com.sevencode.speakle.member.domain.vo.Email;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberVerifyServiceImpl implements MemberVerifyService {
	private final VerificationCodeStore codeStore;
	private final VerificationCodeGenerator codeGenerator;
	private final EmailSender emailSender;
	private final SpringDataMemberJpa memberJpa; // 주입 추가

	// ------------------------------------------------------------
	// 이메일 인증 코드 발송
	// ------------------------------------------------------------
	@Override
	public void sendVerificationCode(String email) {
		String normalized = Email.ofRequired(email).getValue(); // 형식 검증 + 필요시 소문자 정규화
		boolean exists = memberJpa.findByEmailAndDeletedFalse(normalized).isPresent();

		if (exists) {
			throw new DuplicateEmailException("이미 가입된 이메일 입니다.");
		}
		String code = codeGenerator.generate(); // 예: 숫자 6자리
		codeStore.save(email, code);            // TTL 5분 저장

		String subject = "[Speakle] 이메일 인증 코드";
		String body = "인증 코드는 " + code + " 입니다. 5분 내에 입력해 주세요.";
		emailSender.send(email, subject, body);
	}

	// ------------------------------------------------------------
	// 이메일 인증 코드 검증
	// ------------------------------------------------------------
	@Override
	public void verifyEmail(MemberVerifyEmailRequest request) {
		String saved = codeStore.get(request.getEmail());
		if (saved == null || !saved.equals(request.getCode())) {
			throw new InvalidVerificationCodeException("인증 코드가 유효하지 않거나 만료되었습니다.");
		}
		codeStore.remove(request.getEmail()); // 1회성 사용 후 제거
	}
}
