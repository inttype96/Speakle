package com.sevencode.speakle.playlist.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "playlists")
@Getter
@Setter
@NoArgsConstructor
public class CustomPlaylist {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "playlist_id", nullable = false)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "name", nullable = false, length = 100)
	private String name;

	@Column(name = "description", columnDefinition = "TEXT")
	private String description;

	@Column(name = "is_public", nullable = false)
	private Boolean isPublic = true;

	@Column(name = "collaborative", nullable = false)
	private Boolean collaborative = false;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@OneToMany(mappedBy = "playlist", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	private List<CustomPlaylistTrack> songs = new ArrayList<>();

	@PrePersist
	void onCreate() {
		if (createdAt == null) createdAt = Instant.now();
		if (updatedAt == null) updatedAt = Instant.now();
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	// 생성자
	public CustomPlaylist(Long userId, String name, String description, Boolean isPublic, Boolean collaborative) {
		this.userId = userId;
		this.name = name;
		this.description = description;
		this.isPublic = isPublic != null ? isPublic : true;
		this.collaborative = collaborative != null ? collaborative : false;
	}

	// 트랙 수 계산
	public int getTrackCount() {
		return songs != null ? songs.size() : 0;
	}

	// 편의 메서드: 트랙 추가
	public void addTrack(CustomPlaylistTrack track) {
		songs.add(track);
		track.setPlaylistId(this.id);
	}

	// 편의 메서드: 트랙 제거
	public void removeTrack(CustomPlaylistTrack track) {
		songs.remove(track);
		track.setPlaylistId(null);
	}
}
