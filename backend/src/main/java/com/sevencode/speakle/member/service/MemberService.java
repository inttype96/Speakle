package com.sevencode.speakle.member.service;

import com.sevencode.speakle.member.domain.Member;
import com.sevencode.speakle.member.dto.request.MemberRegisterRequest;
import com.sevencode.speakle.member.dto.request.MemberUpdateRequest;

import java.util.Optional;

public interface MemberService {

	Member register(MemberRegisterRequest request);

	Optional<Member> getById(Long id);

	Member updateMember(Long userId, MemberUpdateRequest req);

	void softDelete(Long userId);

}

