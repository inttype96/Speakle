package com.sevencode.speakle.member.controller;

import com.sevencode.speakle.common.dto.ResponseWrapper;
import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.member.domain.Member;
import com.sevencode.speakle.member.service.MemberService;
import com.sevencode.speakle.member.dto.request.*;
import com.sevencode.speakle.member.dto.response.MemberResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class MemberController {
	private final MemberService memberService;

	/** 회원 가입 */
    @PostMapping
    public ResponseEntity<ResponseWrapper<MemberResponse>> register(@Valid @RequestBody MemberRegisterRequest req) {
        Member created = memberService.register(req);
        MemberResponse body = MemberResponse.from(created);
        URI location = URI.create("/api/user/" + created.getId());
        return ResponseEntity
                .created(location)
                .body(ResponseWrapper.success(201, "회원이 생성되었습니다.", body));
    }

    /** 회원 정보 조회(자기 자신) */
    @GetMapping
    public ResponseEntity<ResponseWrapper<MemberResponse>> me(@AuthenticationPrincipal UserPrincipal me) {
        return memberService.getById(me.userId())
                .map(member -> ResponseEntity.ok(ResponseWrapper.success(200, "성공", MemberResponse.from(member))))
                .orElseGet(() -> ResponseEntity.status(404).body(ResponseWrapper.fail(404, "회원 정보를 찾을 수 없습니다.")));
    }

    /** 회원 정보 수정 (Partial Update) */
    @PatchMapping
    public ResponseEntity<ResponseWrapper<MemberResponse>> updateMe(@AuthenticationPrincipal UserPrincipal me, @Valid @RequestBody MemberUpdateRequest req) {
        Member updated = memberService.updateMember(me.userId(), req);
        return ResponseEntity.ok(ResponseWrapper.success(200, "수정되었습니다.", MemberResponse.from(updated)));
    }

    /** 회원 탈퇴 (Soft delete) */
    @DeleteMapping
    public ResponseEntity<ResponseWrapper<Void>> deleteMe(@AuthenticationPrincipal UserPrincipal me) {
        memberService.softDelete(me.userId());
        return ResponseEntity.ok(ResponseWrapper.success(200, "탈퇴 처리되었습니다.", null));
    }

	// /** 비밀번호 변경 */
	// @PatchMapping("/password")

	// /** 임시 비밀번호 발급 */
	// @PostMapping("/temp-password")

	// /** 이메일 인증번호 발송 */
	// @PostMapping("/email/verify/send")

	// /** 이메일 인증번호 검증 */
	// @PostMapping("/email/verify")

	// /** 프로필 이미지 등록 */
	// @PostMapping("/profile-image")

	// /** 프로필 이미지 수정 */
	// @PatchMapping("/profile-image")

	// /** 프로필 이미지 삭제 */
	// @DeleteMapping("/profile-image")

}
