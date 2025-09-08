package com.sevencode.speakle.member.service;

import com.sevencode.speakle.member.domain.Member;
import com.sevencode.speakle.member.domain.vo.*;
import com.sevencode.speakle.member.dto.request.MemberRegisterRequest;
import com.sevencode.speakle.member.dto.request.MemberUpdateRequest;
import com.sevencode.speakle.member.exception.DuplicateEmailException;
import com.sevencode.speakle.member.exception.DuplicateUsernameException;
import com.sevencode.speakle.member.exception.MemberNotFoundException;
import com.sevencode.speakle.member.domain.entity.JpaMemberEntity;
import com.sevencode.speakle.member.repository.SpringDataMemberJpa;
import com.sevencode.speakle.member.repository.mapper.MemberMapper;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class MemberServiceImpl implements MemberService {

	private final SpringDataMemberJpa memberJpa;
	private final MemberMapper memberMapper;
	private final PasswordEncoder passwordEncoder;

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
	public void softDelete(Long userId) {
		JpaMemberEntity e = memberJpa.findByIdAndDeletedFalse(userId)
			.orElseThrow(MemberNotFoundException::new);
		e.setDeleted(true);
		e.setUpdatedAt(OffsetDateTime.now());
		memberJpa.save(e);
	}
}
