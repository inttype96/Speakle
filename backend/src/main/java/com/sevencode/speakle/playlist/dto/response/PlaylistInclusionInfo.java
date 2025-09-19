package com.sevencode.speakle.playlist.dto.response;

import lombok.Getter;
import lombok.Setter;

/**
 * 플레이리스트 포함 정보 DTO
 * 노래가 어떤 플레이리스트에 포함되어 있는지에 대한 정보
 */
@Setter
@Getter
public class PlaylistInclusionInfo {
	// Getters and Setters
	private Long playlistId;
	private String playlistName;
	private String addedAt;

	// 기본 생성자
	public PlaylistInclusionInfo() {}

	// 모든 필드를 받는 생성자
	public PlaylistInclusionInfo(Long playlistId, String playlistName, String addedAt) {
		this.playlistId = playlistId;
		this.playlistName = playlistName;
		this.addedAt = addedAt;
	}

	@Override
	public String toString() {
		return "PlaylistInclusionInfo{" +
			"playlistId=" + playlistId +
			", playlistName='" + playlistName + '\'' +
			", addedAt='" + addedAt + '\'' +
			'}';
	}
}
