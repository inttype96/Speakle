package com.sevencode.speakle.spotify.dto.request;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "플레이리스트 트랙 삭제 요청")
@Getter
@Setter
@NoArgsConstructor
public class RemoveTracksFromPlaylistRequest {

	@Schema(description = "삭제할 트랙 정보 목록")
	@NotEmpty(message = "최소 1개 이상의 트랙이 필요합니다")
	@Size(max = 100, message = "한 번에 최대 100개까지 삭제할 수 있습니다")
	private List<TrackToRemove> tracks;

	@Schema(description = "플레이리스트 스냅샷 ID (선택사항)",
		example = "MTAsNGZhYWZiMzA2Y2I3MjQ4M2Q4NTczZjJlYjU5ZDEwYmJkODdlMTJl")
	private String snapshotId;

	@Schema(description = "삭제할 트랙 정보")
	@Getter
	@Setter
	@NoArgsConstructor
	public static class TrackToRemove {

		@Schema(description = "트랙의 Spotify URI", example = "spotify:track:4iV5W9uYEdYUVa79Axb7Rh")
		private String uri;

		@Schema(description = "삭제할 위치 목록 (선택사항)", example = "[0, 3]")
		private List<Integer> positions;
	}
}
