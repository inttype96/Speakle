package com.sevencode.speakle.member.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class MemberUpdateRequest {
	@Size(min = 2, max = 50)
	private String username;          // null이면 미변경
	private String gender;            // null이면 미변경
	private LocalDate birth;          // null이면 미변경
	private String profileImageUrl;   // null이면 미변경
}
