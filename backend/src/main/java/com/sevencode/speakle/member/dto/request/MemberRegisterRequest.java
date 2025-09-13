package com.sevencode.speakle.member.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class MemberRegisterRequest {

	/** 이메일 (필수) */
	@Email(message = "이메일 형식이 올바르지 않습니다.")
	@NotBlank(message = "이메일은 필수 입력 값입니다.")
	private String email;

	/** 비밀번호 (필수, raw) */
	@NotBlank(message = "비밀번호는 필수 입력 값입니다.")
	@Size(min = 8, max = 64, message = "비밀번호는 8~64자여야 합니다.")
	private String password;

	/** 사용자 이름 (선택, null/blank일 경우 랜덤 생성) */
	private String username;

	/** 성별 (선택, 예: MALE/FEMALE/OTHER 등) */

	private String gender;

	/** 생년월일 (선택) */
	private LocalDate birth;

	/** 프로필 이미지 URL (선택) */
	private String profileImageUrl;
}