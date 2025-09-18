package com.sevencode.speakle.spotify.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "playlist_songs")
@Getter
@Setter
@NoArgsConstructor
public class SpotifyPlaylist {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "playlist_song_id")
	private Long playlistSongId;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "song_id", nullable = false)
	private String songId;

	@Column(name = "play_count", nullable = false, columnDefinition = "INTEGER DEFAULT 0")
	private int playCount = 0;

	@Column(name = "added_at", nullable = false)
	private Instant addedAt;

	@PrePersist
	void onCreate() {
		if (addedAt == null) {
			addedAt = Instant.now();
		}
	}

	// 생성자
	public SpotifyPlaylist(Long userId, String songId) {
		this.userId = userId;
		this.songId = songId;
		this.playCount = 0;
		this.addedAt = Instant.now();
	}
}
