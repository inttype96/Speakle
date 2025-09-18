package com.sevencode.speakle.spotify.dto.request;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "플레이리스트 트랙 추가 요청")
@Getter
@Setter
@NoArgsConstructor
public class AddTracksToPlaylistRequest {

	@Schema(description = "추가할 트랙의 Spotify URI 목록",
		example = "[\"spotify:track:4iV5W9uYEdYUVa79Axb7Rh\", \"spotify:track:1301WleyT98MSxVHPZCA6M\"]")
	@NotEmpty(message = "최소 1개 이상의 트랙이 필요합니다")
	@Size(max = 100, message = "한 번에 최대 100개까지 추가할 수 있습니다")
	private List<String> uris;

	@Schema(description = "트랙을 삽입할 위치 (0부터 시작, null이면 맨 뒤에 추가)", example = "0")
	private Integer position;
}
