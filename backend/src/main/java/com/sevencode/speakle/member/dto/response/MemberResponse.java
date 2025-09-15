package com.sevencode.speakle.member.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.sevencode.speakle.member.domain.Member;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@AllArgsConstructor
public class MemberResponse {
	private Long id;
	private String email;            // may be null (social only)
	private String username;
	private String gender;           // enum name (FEMALE/MALE/NONE)
	private LocalDate birth;
	private String profileImageUrl;
	private boolean deleted;

	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
	private OffsetDateTime createdAt;

	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ssXXX")
	private OffsetDateTime updatedAt;

	public static MemberResponse from(Member m) {
		return new MemberResponse(
			m.getId(),
			m.getEmail() != null ? m.getEmail().getValue() : null,
			m.getUsername() != null ? m.getUsername().getValue() : null,
			m.getGender() != null ? m.getGender().name() : null,
			m.getBirth(),
			m.getProfileImageUrl() != null ? m.getProfileImageUrl().getValue() : null,
			m.isDeleted(),
			m.getCreatedAt(),
			m.getUpdatedAt()
		);
	}
}
