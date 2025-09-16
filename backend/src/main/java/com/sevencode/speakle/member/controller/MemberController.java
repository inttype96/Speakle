package com.sevencode.speakle.member.controller;

import com.sevencode.speakle.common.dto.ResponseWrapper;
import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.member.domain.Member;
import com.sevencode.speakle.member.dto.request.EmailRequest;
import com.sevencode.speakle.member.dto.request.MemberRegisterRequest;
import com.sevencode.speakle.member.dto.request.MemberUpdateRequest;
import com.sevencode.speakle.member.dto.request.MemberVerifyEmailRequest;
import com.sevencode.speakle.member.dto.request.PasswordUpdateRequest;
import com.sevencode.speakle.member.dto.response.MemberResponse;
import com.sevencode.speakle.member.service.MemberService;
import com.sevencode.speakle.member.service.MemberVerifyService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;

import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;


@Tag(name = "User", description = "회원 관리 엔드포인트")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class MemberController {

    private final MemberService memberService;
    private final MemberVerifyService memberVerifyService;

    /** 회원 가입 */
    @Operation(
        summary = "회원 가입",
        description = "새로운 회원을 생성합니다.",
        responses = {
            @ApiResponse(responseCode = "201", description = "생성됨", content = @Content(
                mediaType = "application/json",
                // ResponseWrapper<T> 제네릭을 OAS가 인지하기 어려우므로 예시로 문서화
                examples = @ExampleObject(value = """
                {
                  "status": 201,
                  "message": "회원이 생성되었습니다.",
                  "data": { "id": 1, "email": "user@example.com", "username": "김싸피", "profileImageUrl": null }
                }
                """)
            )),
            @ApiResponse(responseCode = "400", description = "요청 값 오류"),
            @ApiResponse(responseCode = "409", description = "이메일/닉네임 중복")
        }
    )
    @PostMapping
    public ResponseEntity<ResponseWrapper<MemberResponse>> register(@Valid @RequestBody MemberRegisterRequest req) {
        Member created = memberService.register(req);
        MemberResponse body = MemberResponse.from(created);
        URI location = URI.create("/api/user/" + created.getId());
        return ResponseEntity.created(location)
                .body(ResponseWrapper.success(201, "회원이 생성되었습니다.", body));
    }

    /** 회원 정보 조회(자기 자신) */
    @Operation(
        summary = "내 정보 조회",
        description = "현재 인증된 사용자의 정보를 조회합니다.",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = {
            @ApiResponse(responseCode = "200", description = "성공", content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                {
                  "status": 200,
                  "message": "성공",
                  "data": { "id": 1, "email": "user@example.com", "username": "김싸피", "profileImageUrl": null }
                }
                """)
            )),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "404", description = "회원 정보를 찾을 수 없음", content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                { "status": 404, "message": "회원 정보를 찾을 수 없습니다.", "data": null }
                """)
            ))
        }
    )
    @GetMapping
    public ResponseEntity<ResponseWrapper<MemberResponse>> me(@AuthenticationPrincipal UserPrincipal me) {
        return memberService.getById(me.userId())
                .map(m -> ResponseEntity.ok(ResponseWrapper.success(200, "성공", MemberResponse.from(m))))
                .orElseGet(() -> ResponseEntity.status(404).body(ResponseWrapper.fail(404, "회원 정보를 찾을 수 없습니다.")));
    }

    /** 회원 정보 수정 (Partial Update) */
    @Operation(
        summary = "내 정보 수정",
        description = "전달된 필드만 부분 수정합니다.",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = {
            @ApiResponse(responseCode = "200", description = "수정됨", content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                {
                  "status": 200,
                  "message": "수정되었습니다.",
                  "data": { "id": 1, "email": "user@example.com", "username": "변경됨" }
                }
                """)
            )),
            @ApiResponse(responseCode = "400", description = "요청 값 오류"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "409", description = "닉네임 중복")
        }
    )
    @PatchMapping
    public ResponseEntity<ResponseWrapper<MemberResponse>> updateMe(
            @AuthenticationPrincipal UserPrincipal me,
            @Valid @RequestBody MemberUpdateRequest req
    ) {
        Member updated = memberService.updateMember(me.userId(), req);
        return ResponseEntity.ok(ResponseWrapper.success(200, "수정되었습니다.", MemberResponse.from(updated)));
    }

    /** 회원 탈퇴 (Soft delete) */
    @Operation(
        summary = "회원 탈퇴",
        description = "계정을 소프트 삭제합니다.",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = {
            @ApiResponse(responseCode = "200", description = "탈퇴 처리됨", content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                { "status": 200, "message": "탈퇴 처리되었습니다.", "data": null }
                """)
            )),
            @ApiResponse(responseCode = "401", description = "인증 필요")
        }
    )
    @DeleteMapping
    public ResponseEntity<ResponseWrapper<Void>> deleteMe(@AuthenticationPrincipal UserPrincipal me) {
        memberService.softDelete(me.userId());
        return ResponseEntity.ok(ResponseWrapper.success(200, "탈퇴 처리되었습니다.", null));
    }

    /** 
     * 임시 비밀번호 발급 
     * 입력 : 이메일 
     * 임시 비밀번호 생성 및 변경 저장 후 이메일 발송
     */
    @Operation(
        summary = "임시 비밀번호 전송",
        description = "이메일로 임시 비밀번호를 발송합니다.",
        responses = {
            @ApiResponse(responseCode = "200", description = "발송 성공", content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                { "status": 200, "message": "임시 비밀번호가 이메일로 발송되었습니다.", "data": null }
                """)
            )),
            @ApiResponse(responseCode = "404", description = "이메일 계정 없음")
        }
    )
    @PostMapping("/temp-password")
    public ResponseEntity<ResponseWrapper<Void>> sendTempPassword(@Valid @RequestBody EmailRequest request) {
        memberService.sendTemporaryPassword(request.getEmail());
        return ResponseEntity.ok(ResponseWrapper.success(200, "임시 비밀번호가 이메일로 발송되었습니다.", null));
    }


  /** 이메일 인증번호 발송 */
    @Operation(
        summary = "이메일 인증 코드 발송",
        description = "입력된 이메일로 인증 코드를 전송합니다.",
        responses = {
            @ApiResponse(responseCode = "200", description = "발송 성공", content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                { "status": 200, "message": "인증 코드가 이메일로 발송되었습니다.", "data": null }
                """)
            )),
            @ApiResponse(responseCode = "409", description = "이미 인증된 이메일")
        }
    )
    @PostMapping("/verify-email/send")
    public ResponseEntity<ResponseWrapper<Void>> sendVerificationCode(@Valid @RequestBody EmailRequest request) {
        memberVerifyService.sendVerificationCode(request.getEmail());
        return ResponseEntity.ok(ResponseWrapper.success(200, "인증 코드가 이메일로 발송되었습니다.", null));
    }
   /** 이메일 인증번호 검증 */
    @Operation(
        summary = "이메일 인증 코드 확인",
        description = "이메일로 받은 인증 코드를 검증합니다.",
        responses = {
            @ApiResponse(responseCode = "200", description = "검증 성공", content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                { "status": 200, "message": "이메일 인증이 완료되었습니다.", "data": null }
                """)
            )),
            @ApiResponse(responseCode = "400", description = "코드 불일치 또는 만료됨")
        }
    )
    @PostMapping("/verify-email")
    public ResponseEntity<ResponseWrapper<Void>> verifyEmailCode(@Valid @RequestBody MemberVerifyEmailRequest request) {
        memberVerifyService.verifyEmail(request);
        return ResponseEntity.ok(ResponseWrapper.success(200, "이메일 인증이 완료되었습니다.", null));
    }

    /** 비밀번호 변경 */
    @Operation(
        summary = "비밀번호 변경",
        description = "기존 비밀번호를 검증하고 새 비밀번호로 변경합니다.",
        security = @SecurityRequirement(name = "bearerAuth"),
        responses = {
            @ApiResponse(responseCode = "200", description = "변경 성공", content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(value = """
                { "status": 200, "message": "비밀번호가 변경되었습니다.", "data": null }
                """)
            )),
            @ApiResponse(responseCode = "400", description = "입력값 오류"),
            @ApiResponse(responseCode = "401", description = "인증 필요"),
            @ApiResponse(responseCode = "403", description = "기존 비밀번호 불일치")
        }
    )
    @PatchMapping("/update-password")
    public ResponseEntity<ResponseWrapper<Void>> updatePassword(
            @AuthenticationPrincipal UserPrincipal me,
            @Valid @RequestBody PasswordUpdateRequest request
    ) {
        memberService.updatePassword(me, request); // ← me.userId() 대신 me 그대로 전달
        return ResponseEntity.ok(ResponseWrapper.success(200, "비밀번호가 변경되었습니다.", null));
    }

}


	// /** 프로필 이미지 등록 */
	// @PostMapping("/profile-image")

	// /** 프로필 이미지 수정 */
	// @PatchMapping("/profile-image")

	// /** 프로필 이미지 삭제 */
	// @DeleteMapping("/profile-image")

