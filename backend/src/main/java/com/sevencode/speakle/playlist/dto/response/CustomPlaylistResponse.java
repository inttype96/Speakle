package com.sevencode.speakle.playlist.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 자체 플레이리스트 응답 DTO (Spotify API 호환)
 */
@Schema(description = "자체 플레이리스트 정보")
@Getter
@Setter
@NoArgsConstructor
public class CustomPlaylistResponse {
	@Schema(description = "플레이리스트 고유 ID", example = "1")
	private String id;

	@Schema(description = "플레이리스트 이름", example = "내가 좋아하는 음악")
	private String name;

	@Schema(description = "플레이리스트 설명", example = "감성적인 음악들을 모은 플레이리스트")
	private String description;

	@Schema(description = "공개 여부", example = "true")
	@JsonProperty("public")
	private Boolean isPublic;

	@Schema(description = "공동작업 허용 여부", example = "false")
	private Boolean collaborative;

	@Schema(description = "플레이리스트 소유자")
	private Owner owner;

	@Schema(description = "총 트랙 수 정보")
	private TracksInfo tracks;

	@Schema(description = "이미지 목록")
	private List<Image> images;

	@Schema(description = "플레이리스트 URI", example = "custom:playlist:1")
	private String uri;

	@Schema(description = "외부 URL")
	@JsonProperty("external_urls")
	private ExternalUrls externalUrls;

	@Schema(description = "자체 플레이리스트 여부", example = "true")
	private Boolean custom = true;

	@Schema(description = "Spotify 동기화 상태", example = "false")
	@JsonProperty("spotify_synced")
	private Boolean spotifySynced = false;

	@Getter
	@Setter
	@NoArgsConstructor
	public static class Owner {
		private String id;
		@JsonProperty("display_name")
		private String displayName;
		private String uri;
		@JsonProperty("external_urls")
		private ExternalUrls externalUrls;
	}

	@Getter
	@Setter
	@NoArgsConstructor
	public static class TracksInfo {
		private String href;
		private Integer total;
	}

	@Getter
	@Setter
	@NoArgsConstructor
	public static class Image {
		private String url;
		private Integer height;
		private Integer width;
	}

	@Getter
	@Setter
	@NoArgsConstructor
	public static class ExternalUrls {
		private String spotify;
	}
}
