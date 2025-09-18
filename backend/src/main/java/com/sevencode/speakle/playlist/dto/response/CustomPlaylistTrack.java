package com.sevencode.speakle.playlist.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 플레이리스트 트랙 정보 DTO
 */
@Schema(description = "플레이리스트 트랙 정보")
@Getter
@Setter
@NoArgsConstructor
public class CustomPlaylistTrack {
	@Schema(description = "트랙이 추가된 시간")
	@JsonProperty("added_at")
	private String addedAt;

	@Schema(description = "트랙 정보")
	private Track track;

	@Getter
	@Setter
	@NoArgsConstructor
	public static class Track {
		@Schema(description = "트랙 ID")
		private String id;

		@Schema(description = "트랙 이름")
		private String name;

		@Schema(description = "트랙 URI")
		private String uri;

		@Schema(description = "아티스트 목록")
		private List<Artist> artists;

		@Schema(description = "앨범 정보")
		private Album album;

		@Schema(description = "트랙 길이 (밀리초)")
		@JsonProperty("duration_ms")
		private Integer durationMs;

		@Schema(description = "트랙 길이 (분:초 형식)", example = "3:43")
		@JsonProperty("duration_formatted")
		private String durationFormatted;

		@Schema(description = "외부 URL")
		@JsonProperty("external_urls")
		private CustomPlaylistResponse.ExternalUrls externalUrls;

		@Schema(description = "인기도 (0-100)")
		private Integer popularity;

		@Schema(description = "미리보기 URL")
		@JsonProperty("preview_url")
		private String previewUrl;
	}

	@Getter
	@Setter
	@NoArgsConstructor
	public static class Artist {
		private String id;
		private String name;
		private String uri;
		@JsonProperty("external_urls")
		private CustomPlaylistResponse.ExternalUrls externalUrls;
	}

	@Getter
	@Setter
	@NoArgsConstructor
	public static class Album {
		private String id;
		private String name;
		private List<CustomPlaylistResponse.Image> images;
		@JsonProperty("external_urls")
		private CustomPlaylistResponse.ExternalUrls externalUrls;
		@JsonProperty("release_date")
		private String releaseDate;
	}
}
