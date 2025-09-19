package com.sevencode.speakle.playlist.dto.response;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 노래가 사용자의 플레이리스트에 포함되어 있는지 확인하는 응답 DTO
 */
@Getter
@Setter
public class SongInclusionCheckResponse {
	// Getters and Setters
	private String songId;
	private boolean isIncluded;
	private int playlistCount;
	private List<PlaylistInclusionInfo> playlists;

	// 기본 생성자
	public SongInclusionCheckResponse() {}

	// 모든 필드를 받는 생성자
	public SongInclusionCheckResponse(String songId, boolean isIncluded, int playlistCount, List<PlaylistInclusionInfo> playlists) {
		this.songId = songId;
		this.isIncluded = isIncluded;
		this.playlistCount = playlistCount;
		this.playlists = playlists;
	}

	@Override
	public String toString() {
		return "SongInclusionCheckResponse{" +
			"songId='" + songId + '\'' +
			", isIncluded=" + isIncluded +
			", playlistCount=" + playlistCount +
			", playlists=" + playlists +
			'}';
	}
}
