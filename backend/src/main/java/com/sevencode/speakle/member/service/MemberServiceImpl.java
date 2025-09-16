package com.sevencode.speakle.member.service;

import com.sevencode.speakle.auth.service.RefreshTokenService;
import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.member.domain.Member;
import com.sevencode.speakle.member.domain.vo.*;
import com.sevencode.speakle.member.dto.request.MemberRegisterRequest;
import com.sevencode.speakle.member.dto.request.MemberUpdateRequest;
import com.sevencode.speakle.member.dto.request.PasswordUpdateRequest;
import com.sevencode.speakle.member.exception.DuplicateEmailException;
import com.sevencode.speakle.member.exception.DuplicateUsernameException;
import com.sevencode.speakle.member.exception.InvalidPasswordException;
import com.sevencode.speakle.member.exception.MemberNotFoundException;
import com.sevencode.speakle.member.domain.entity.JpaMemberEntity;
import com.sevencode.speakle.member.repository.SpringDataMemberJpa;
import com.sevencode.speakle.member.repository.mapper.MemberMapper;
import com.sevencode.speakle.member.service.utils.EmailSender;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class MemberServiceImpl implements MemberService {

	private final SpringDataMemberJpa memberJpa;
	private final MemberMapper memberMapper;
	private final RefreshTokenService refreshTokenService;
	private final PasswordEncoder passwordEncoder;
	private final EmailSender emailSender;

	// ------------------------------------------------------------
	// 회원가입 (일반) + 삭제 계정 복구
	// 이메일은 전역 유일(soft-delete 포함)
	// ------------------------------------------------------------
	@Override
	@Transactional
	public Member register(MemberRegisterRequest request) {

		/* 입력 필수 x */
		String username =
			(request.getUsername() == null || request.getUsername().isBlank()) ? null : request.getUsername();

		/* 저장 필수 x */
		String gender = request.getGender();
		LocalDate birth = request.getBirth();
		String profileImageUrl = request.getProfileImageUrl();

		Email emailVo = Email.ofRequired(request.getEmail());
		PasswordHash passwordHash = PasswordHash.ofHashed(passwordEncoder.encode(request.getPassword()));

		Username usernameVo;
		if (username == null || username.isBlank()) {
			usernameVo = new Username("user_" + UUID.randomUUID().toString().substring(0, 8));
		} else {
			usernameVo = new Username(username);
		}

		Gender genderVo = gender != null ? Gender.from(gender) : null;

		Optional<JpaMemberEntity> existingOpt = memberJpa.findByEmail(emailVo.getValue());

		if (existingOpt.isPresent()) {
			JpaMemberEntity existing = existingOpt.get();

			if (!existing.isDeleted()) {
				throw new DuplicateEmailException("이미 사용 중인 이메일입니다.");
			}

			existing.setPassword(passwordHash.getValue());

			if (genderVo != null)
				existing.setGender(genderVo.name());
			if (birth != null)
				existing.setBirth(birth);
			if (profileImageUrl != null)
				existing.setProfileImageUrl(profileImageUrl);

			existing.setDeleted(false);
			existing.setUpdatedAt(OffsetDateTime.now());

			JpaMemberEntity saved = memberJpa.save(existing);
			return memberMapper.toDomain(saved);
		}

		if (memberJpa.existsByUsername(usernameVo.getValue())) {
			throw new DuplicateUsernameException("이미 사용 중인 사용자 이름입니다.");
		}

		Member member = Member.create(emailVo, passwordHash, usernameVo, genderVo, birth, profileImageUrl);

		JpaMemberEntity entity = memberMapper.toEntity(member);
		JpaMemberEntity saved = memberJpa.save(entity);

		return memberMapper.toDomain(saved);
	}

	// ------------------------------------------------------------
	// 조회
	// ------------------------------------------------------------
	@Override
	@Transactional(readOnly = true)
	public Optional<Member> getById(Long id) {
		return memberJpa.findByIdAndDeletedFalse(id).map(memberMapper::toDomain);
	}

	@Transactional(readOnly = true)
	public Member getMemberByEmail(String email) {
		Email emailVo = Email.ofRequired(email);
		JpaMemberEntity e = memberJpa.findByEmailAndDeletedFalse(emailVo.getValue())
			.orElseThrow(MemberNotFoundException::new);
		return memberMapper.toDomain(e);
	}

	// ------------------------------------------------------------
	// 자기 정보 수정 (Partial Update)
	// - null/blank는 덮지 않는다
	// - username 정책: 기본은 중복 허용 / 필요 시 활성-유일 검사 추가
	// ------------------------------------------------------------
	@Override
	public Member updateMember(Long userId, MemberUpdateRequest req) {
		JpaMemberEntity e = memberJpa.findByIdAndDeletedFalse(userId)
			.orElseThrow(MemberNotFoundException::new);

		if (req.getUsername() != null && !req.getUsername().isBlank()) {
			Username usernameVo = new Username(req.getUsername());

			if (memberJpa.existsByUsername(usernameVo.getValue())) {
				throw new DuplicateUsernameException("이미 사용 중인 사용자 이름입니다.");
			}

			e.setUsername(usernameVo.getValue());
		}

		if (req.getGender() != null && !req.getGender().isBlank()) {
			Gender genderVo = Gender.from(req.getGender());
			e.setGender(genderVo.name());
		}

		if (req.getBirth() != null) {
			e.setBirth(req.getBirth());
		}

		if (req.getProfileImageUrl() != null && !req.getProfileImageUrl().isBlank()) {
			ProfileImageUrl url = new ProfileImageUrl(req.getProfileImageUrl());
			e.setProfileImageUrl(url.getValue());
		}

		e.setUpdatedAt(OffsetDateTime.now());
		JpaMemberEntity saved = memberJpa.save(e);
		return memberMapper.toDomain(saved);
	}

	// ------------------------------------------------------------
	// 자기 계정 소프트 삭제
	// ------------------------------------------------------------
	@Override
	public void softDelete(Long userId) {
		JpaMemberEntity e = memberJpa.findByIdAndDeletedFalse(userId)
			.orElseThrow(MemberNotFoundException::new);
		e.setDeleted(true);
		e.setUpdatedAt(OffsetDateTime.now());
		memberJpa.save(e);
	}

	// ------------------------------------------------------------
	// 이메일로 임시 비밀번호 발급 & 전송
	// ------------------------------------------------------------
	@Override
	public void sendTemporaryPassword(String email) {
		// 1. 이메일로 회원 조회 (없으면 예외)
		JpaMemberEntity member = memberJpa.findByEmailAndDeletedFalse(email)
			.orElseThrow(() -> new MemberNotFoundException("해당 이메일을 가진 회원이 존재하지 않습니다."));

		// 2. 임시 비밀번호 생성 (랜덤 10자리)
		String tempPassword = UUID.randomUUID().toString().substring(0, 10);

		// 3. 비밀번호 해시 후 저장
		String hashed = passwordEncoder.encode(tempPassword);
		member.setPassword(hashed);
		member.setUpdatedAt(OffsetDateTime.now());
		memberJpa.save(member);

		// 4. 이메일 발송
		String subject = "[Speakle] 임시 비밀번호 발급 안내";
		String body = "임시 비밀번호: " + tempPassword + "\n로그인 후 반드시 비밀번호를 변경해 주세요.";
		emailSender.send(email, subject, body);

		// 5. 감사 로그
		log.info("임시 비밀번호 발급 완료: userId={}, email={}", member.getId(), email);
	}

	// ------------------------------------------------------------
	// 사용자 비밀번호 변경
	// ------------------------------------------------------------
	@Override
	public void updatePassword(UserPrincipal me, PasswordUpdateRequest request) {
		if (me == null) {
			throw new IllegalArgumentException("인증 정보가 없습니다.");
		}

		// 1) 회원 조회
		JpaMemberEntity e = memberJpa.findByIdAndDeletedFalse(me.userId())
			.orElseThrow(MemberNotFoundException::new);

		// 2) 기존 비밀번호 검증
		if (!passwordEncoder.matches(request.getCurrentPassword(), e.getPassword())) {
			throw new InvalidPasswordException("기존 비밀번호가 일치하지 않습니다.");
		}

		// 3) 새 비밀번호 해시 후 저장
		String newHashed = passwordEncoder.encode(request.getNewPassword());
		e.setPassword(newHashed);
		e.setUpdatedAt(OffsetDateTime.now());
		memberJpa.save(e);

		// 4) 세션/리프레시 토큰 무효화 (auth 모듈)
		refreshTokenService.revokeAll(me.userId());

	}
}
