package com.sevencode.speakle.playlist.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 플레이리스트 트랙 목록 응답 DTO
 */
@Schema(description = "플레이리스트 트랙 목록")
@Getter
@Setter
@NoArgsConstructor
public class CustomPlaylistTracksResponse {

	@Schema(description = "API 엔드포인트 URL")
	private String href;

	@Schema(description = "가져온 트랙 수")
	private Integer limit;

	@Schema(description = "다음 페이지 URL")
	private String next;

	@Schema(description = "건너뛴 트랙 수")
	private Integer offset;

	@Schema(description = "이전 페이지 URL")
	private String previous;

	@Schema(description = "총 트랙 수")
	private Integer total;

	@Schema(description = "트랙 목록")
	private List<CustomPlaylistTrack> items;
}
