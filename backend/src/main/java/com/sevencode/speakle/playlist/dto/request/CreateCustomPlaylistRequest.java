package com.sevencode.speakle.playlist.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 자체 플레이리스트 생성/수정 요청 DTO
 */
@Schema(description = "자체 플레이리스트 생성/수정 요청")
@Getter
@Setter
@NoArgsConstructor
public class CreateCustomPlaylistRequest {
	@Schema(description = "플레이리스트 이름", example = "내가 좋아하는 음악")
	@NotBlank(message = "플레이리스트 이름은 필수입니다")
	@Size(max = 100, message = "플레이리스트 이름은 100자 이하여야 합니다")
	private String name;

	@Schema(description = "플레이리스트 설명", example = "감성적인 음악들을 모은 플레이리스트")
	@Size(max = 300, message = "플레이리스트 설명은 300자 이하여야 합니다")
	private String description;

	@Schema(description = "공개 여부", example = "true", defaultValue = "true")
	@JsonProperty("public")
	private Boolean isPublic = true;

	@Schema(description = "공동작업 허용 여부", example = "false", defaultValue = "false")
	private Boolean collaborative = false;
}
