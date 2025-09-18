package com.sevencode.speakle.playlist.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 트랙 추가/삭제 응답 DTO
 */
@Schema(description = "트랙 추가/삭제 응답")
@Getter
@Setter
@NoArgsConstructor
public class PlaylistTrackOperationResponse {
	@Schema(description = "스냅샷 ID", example = "custom_1234567890")
	@JsonProperty("snapshot_id")
	private String snapshotId;

	@Schema(description = "자체 플레이리스트 여부", example = "true")
	private Boolean custom = true;

	@Schema(description = "응답 메시지")
	private String message;
}
