package com.sevencode.speakle.member.repository.mapper;

import org.springframework.stereotype.Component;

import com.sevencode.speakle.member.domain.Member;
import com.sevencode.speakle.member.domain.entity.JpaMemberEntity;
import com.sevencode.speakle.member.domain.vo.Email;
import com.sevencode.speakle.member.domain.vo.Gender;
import com.sevencode.speakle.member.domain.vo.PasswordHash;
import com.sevencode.speakle.member.domain.vo.ProfileImageUrl;
import com.sevencode.speakle.member.domain.vo.Username;

@Component
public class MemberMapper {

	/** 도메인 → 엔티티 (정책 없음, 값만 푼다) */
	public JpaMemberEntity toEntity(Member m) {
		if (m == null)
			return null;

		JpaMemberEntity e = new JpaMemberEntity();
		e.setId(m.getId());
		e.setEmail(m.getEmail() == null ? null : m.getEmail().getValue());
		e.setPassword(m.getPasswordHash() == null ? null : m.getPasswordHash().getValue());
		e.setUsername(m.getUsername() == null ? null : m.getUsername().getValue());
		e.setGender(m.getGender() == null ? null : m.getGender().name());
		e.setBirth(m.getBirth());
		e.setProfileImageUrl(m.getProfileImageUrl() == null ? null : m.getProfileImageUrl().getValue());
		e.setDeleted(m.isDeleted());
		e.setCreatedAt(m.getCreatedAt());
		e.setUpdatedAt(m.getUpdatedAt());
		return e;
	}

	/** 엔티티 → 도메인 (형식 검증은 VO가 하되, 가입타입 정책/중복 체크는 하지 않음) */
	public Member toDomain(JpaMemberEntity e) {
		if (e == null)
			return null;

		// Email: DB에 없을 수도 있으니 optional 생성
		Email emailVo = (e.getEmail() == null) ? Email.ofOptional(null)
			: Email.ofOptional(e.getEmail());

		// Password: 소셜 계정이면 null → none()
		PasswordHash pwVo = (e.getPassword() == null) ? PasswordHash.none()
			: PasswordHash.ofHashed(e.getPassword());

		Username usernameVo = (e.getUsername() == null) ? null : new Username(e.getUsername());
		Gender genderVo = (e.getGender() == null) ? null : Gender.from(e.getGender());
		ProfileImageUrl imgVo = (e.getProfileImageUrl() == null) ? null
			: new ProfileImageUrl(e.getProfileImageUrl());

		return Member.of(
			e.getId(),
			emailVo,
			pwVo,
			usernameVo,
			genderVo,
			e.getBirth(),
			imgVo,
			e.isDeleted(),
			e.getCreatedAt(),
			e.getUpdatedAt()
		);
	}
}