package com.sevencode.speakle.spotify.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "Spotify 플레이리스트 정보")
@Getter
@NoArgsConstructor
public class SpotifyPlaylistResponse {

	@Schema(description = "플레이리스트 고유 ID", example = "37i9dQZF1DXcBWIGoYBM5M")
	@JsonProperty("id")
	private String id;

	@Schema(description = "플레이리스트 이름", example = "Today's Top Hits")
	@JsonProperty("name")
	private String name;

	@Schema(description = "플레이리스트 설명", example = "Right Now")
	@JsonProperty("description")
	private String description;

	@Schema(description = "공개 여부", example = "true")
	@JsonProperty("public")
	private Boolean isPublic;

	@Schema(description = "공동작업 허용 여부", example = "false")
	@JsonProperty("collaborative")
	private Boolean collaborative;

	@Schema(description = "플레이리스트 소유자")
	@JsonProperty("owner")
	private Owner owner;

	@Schema(description = "총 트랙 수 정보")
	@JsonProperty("tracks")
	private TracksInfo tracks;

	@Schema(description = "이미지 목록")
	@JsonProperty("images")
	private List<Image> images;

	@Schema(description = "Spotify URI", example = "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M")
	@JsonProperty("uri")
	private String uri;

	@Schema(description = "외부 URL")
	@JsonProperty("external_urls")
	private ExternalUrls externalUrls;

	@Getter
	@NoArgsConstructor
	public static class Owner {
		@JsonProperty("id")
		private String id;

		@JsonProperty("display_name")
		private String displayName;

		@JsonProperty("uri")
		private String uri;

		@JsonProperty("external_urls")
		private ExternalUrls externalUrls;
	}

	@Getter
	@NoArgsConstructor
	public static class TracksInfo {
		@JsonProperty("total")
		private Integer total;

		@JsonProperty("href")
		private String href;
	}

	@Getter
	@NoArgsConstructor
	public static class Image {
		@JsonProperty("url")
		private String url;

		@JsonProperty("height")
		private Integer height;

		@JsonProperty("width")
		private Integer width;
	}

	@Getter
	@NoArgsConstructor
	public static class ExternalUrls {
		@JsonProperty("spotify")
		private String spotify;
	}
}
