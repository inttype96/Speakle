package com.sevencode.speakle.playlist.entity;

import java.time.Instant;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "playlist_songs")
@Getter
@Setter
@NoArgsConstructor
public class CustomPlaylistTrack {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "playlist_song_id")
	private Long playlistSongId;

	@Column(name = "playlist_id", nullable = false)
	private Long playlistId;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "song_id", nullable = false)
	private String songId;

	@Column(name = "play_count", nullable = false, columnDefinition = "INTEGER DEFAULT 0")
	private int playCount = 0;

	@Column(name = "added_at", nullable = false)
	private Instant addedAt;

	// CustomPlaylist와의 관계 설정
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "playlist_id", insertable = false, updatable = false)
	private CustomPlaylist playlist;

	@PrePersist
	void onCreate() {
		if (addedAt == null) {
			addedAt = Instant.now();
		}
	}

	public CustomPlaylistTrack(Long playlistId, Long userId, String songId) {
		this.playlistId = playlistId;
		this.userId = userId;
		this.songId = songId;
		this.playCount = 0;
		this.addedAt = Instant.now();
	}

}
