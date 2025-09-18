package com.sevencode.speakle.playlist.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "플레이리스트 삭제 응답")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class DeletePlaylistResponse {

	@Schema(description = "성공 메시지", example = "플레이리스트가 성공적으로 삭제되었습니다.")
	private String message;

	@Schema(description = "삭제된 플레이리스트 ID", example = "123")
	private Long playlistId;

	@Schema(description = "삭제 성공 여부", example = "true")
	private boolean success;

	public static DeletePlaylistResponse success(Long playlistId) {
		return new DeletePlaylistResponse(
			"플레이리스트가 성공적으로 삭제되었습니다.",
			playlistId,
			true
		);
	}
}
