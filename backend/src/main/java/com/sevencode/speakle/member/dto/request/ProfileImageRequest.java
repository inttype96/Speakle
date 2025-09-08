package com.sevencode.speakle.member.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

@Getter
@NoArgsConstructor
public class ProfileImageRequest {
	@NotBlank
	private String url;
}