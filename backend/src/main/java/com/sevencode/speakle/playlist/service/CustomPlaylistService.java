package com.sevencode.speakle.playlist.service;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.playlist.dto.request.AddTracksToCustomPlaylistRequest;
import com.sevencode.speakle.playlist.dto.request.CreateCustomPlaylistRequest;
import com.sevencode.speakle.playlist.dto.request.RemoveTracksFromCustomPlaylistRequest;
import com.sevencode.speakle.playlist.dto.response.CustomPlaylistResponse;
import com.sevencode.speakle.playlist.dto.response.CustomPlaylistTracksResponse;
import com.sevencode.speakle.playlist.entity.CustomPlaylist;
import com.sevencode.speakle.playlist.repository.CustomPlaylistRepository;
import com.sevencode.speakle.playlist.repository.CustomPlaylistTrackRepository;
import com.sevencode.speakle.song.domain.Song;
import com.sevencode.speakle.song.repository.SongRepository;
import com.sevencode.speakle.spotify.service.SpotifyService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomPlaylistService {

	private final CustomPlaylistRepository playlistRepository;
	private final CustomPlaylistTrackRepository trackRepository;
	private final SongRepository songRepository;

	/**
	 * 사용자가 기본 플레이리스트를 가지고 있는지 확인 (중복 방지용)
	 */
	@Transactional(readOnly = true)
	public boolean hasDefaultPlaylist(Long userId) {
		try {
			long count = playlistRepository.countByUserId(userId);
			boolean hasPlaylist = count > 0;

			log.debug("사용자 기본 플레이리스트 존재 여부 확인 - userId: {}, hasPlaylist: {}",
				userId, hasPlaylist);

			return hasPlaylist;

		} catch (Exception e) {
			log.error("기본 플레이리스트 존재 여부 확인 실패 - userId: {}", userId, e);
			// 확인 실패 시 안전하게 false 반환 (중복 생성 허용)
			return false;
		}
	}

	/**
	 * 기본 플레이리스트 생성
	 */
	@Transactional
	public CustomPlaylist createDefaultPlaylist(Long userId, String name, String description) {
		try {
			log.info("기본 플레이리스트 생성 시작 - userId: {}, name: {}", userId, name);

			// 중복 생성 방지 (Double-check locking 패턴)
			if (hasDefaultPlaylist(userId)) {
				log.warn("이미 플레이리스트가 존재하여 생성 건너뜀 - userId: {}", userId);
				List<CustomPlaylist> existingPlaylists = playlistRepository.findByUserIdOrderByCreatedAtDesc(userId);
				return existingPlaylists.isEmpty() ? null : existingPlaylists.get(0);
			}

			CustomPlaylist playlist = new CustomPlaylist(
				userId,
				name,
				description,
				true,  // 기본값: 공개
				false  // 기본값: 협업 비허용
			);

			CustomPlaylist savedPlaylist = playlistRepository.save(playlist);

			log.info("기본 플레이리스트 생성 완료 - userId: {}, playlistId: {}, name: {}",
				userId, savedPlaylist.getId(), savedPlaylist.getName());

			return savedPlaylist;

		} catch (Exception e) {
			log.error("기본 플레이리스트 생성 실패 - userId: {}, name: {}", userId, name, e);
			throw new RuntimeException("기본 플레이리스트 생성에 실패했습니다.", e);
		}
	}

	/**
	 * 자체 플레이리스트 생성 (Spotify API와 동일한 응답)
	 */
	@Transactional
	public CustomPlaylistResponse createPlaylist(UserPrincipal auth, CreateCustomPlaylistRequest request) {
		log.info("자체 플레이리스트 생성 - userId: {}, name: {}", auth.userId(), request.getName());

		CustomPlaylist playlist = new CustomPlaylist(
			auth.userId(),
			request.getName(),
			request.getDescription(),
			request.getIsPublic(),
			request.getCollaborative()
		);

		CustomPlaylist saved = playlistRepository.save(playlist);
		log.info("자체 플레이리스트 생성 완료 - id: {}", saved.getId());

		return convertToResponse(saved, auth);
	}

	/**
	 * 사용자 플레이리스트 목록 조회 (자체 + Spotify 플레이리스트 통합)
	 */
	public List<CustomPlaylistResponse> getUserPlaylists(UserPrincipal auth) {
		if (auth == null) {
			log.warn("사용자 인증 정보가 null입니다");
			throw new IllegalArgumentException("사용자 인증이 필요합니다");
		}

		log.info("사용자 플레이리스트 목록 조회 - userId: {}", auth.userId());

		List<CustomPlaylist> customPlaylists = playlistRepository.findByUserIdOrderByCreatedAtDesc(auth.userId());

		return customPlaylists.stream()
			.map(playlist -> convertToResponse(playlist, auth))
			.collect(Collectors.toList());
	}

	/**
	 * 플레이리스트 상세 조회
	 */
	public CustomPlaylistResponse getPlaylist(UserPrincipal auth, Long playlistId) {
		log.info("플레이리스트 상세 조회 - userId: {}, playlistId: {}", auth.userId(), playlistId);

		CustomPlaylist playlist = playlistRepository.findByIdAndUserId(playlistId, auth.userId())
			.orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));

		return convertToResponse(playlist, auth);
	}

	/**
	 * 플레이리스트 수정
	 */
	@Transactional
	public void updatePlaylist(UserPrincipal auth, Long playlistId, CreateCustomPlaylistRequest request) {
		log.info("플레이리스트 수정 - userId: {}, playlistId: {}", auth.userId(), playlistId);

		CustomPlaylist playlist = playlistRepository.findByIdAndUserId(playlistId, auth.userId())
			.orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));

		if (request.getName() != null) playlist.setName(request.getName());
		if (request.getDescription() != null) playlist.setDescription(request.getDescription());
		if (request.getIsPublic() != null) playlist.setIsPublic(request.getIsPublic());
		if (request.getCollaborative() != null) playlist.setCollaborative(request.getCollaborative());

		playlistRepository.save(playlist);
		log.info("플레이리스트 수정 완료 - playlistId: {}", playlistId);
	}

	/**
	 * 플레이리스트 삭제
	 */
	@Transactional
	public void deletePlaylist(UserPrincipal auth, Long playlistId) {
		log.info("플레이리스트 삭제 - userId: {}, playlistId: {}", auth.userId(), playlistId);

		CustomPlaylist playlist = playlistRepository.findByIdAndUserId(playlistId, auth.userId())
			.orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));

		playlistRepository.delete(playlist);
		log.info("플레이리스트 삭제 완료 - playlistId: {}", playlistId);
	}

	/**
	 * 플레이리스트 트랙 목록 조회
	 */
	public CustomPlaylistTracksResponse getPlaylistTracks(UserPrincipal auth, Long playlistId, Integer limit, Integer offset, String sortBy, String order) {
		log.info("플레이리스트 트랙 조회 - userId: {}, playlistId: {}, limit: {}, offset: {}, sortBy: {}, order: {}",
			auth.userId(), playlistId, limit, offset, sortBy, order);

		CustomPlaylist playlist = playlistRepository.findByIdAndUserId(playlistId, auth.userId())
			.orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));

		Pageable pageable = PageRequest.of(offset / limit, limit);
		Page<com.sevencode.speakle.playlist.entity.CustomPlaylistTrack> tracks = getTracksBySortOption(playlistId, pageable, sortBy, order);

		CustomPlaylistTracksResponse response = new CustomPlaylistTracksResponse();
		response.setHref("/api/playlists/" + playlistId + "/tracks");
		response.setLimit(limit);
		response.setOffset(offset);
		response.setTotal((int) tracks.getTotalElements());

		String sortParams = (sortBy != null && order != null) ? "&sortBy=" + sortBy + "&order=" + order : "";
		response.setNext(tracks.hasNext() ? "/api/playlists/" + playlistId + "/tracks?offset=" + (offset + limit) + "&limit=" + limit + sortParams : null);
		response.setPrevious(offset > 0 ? "/api/playlists/" + playlistId + "/tracks?offset=" + Math.max(0, offset - limit) + "&limit=" + limit + sortParams : null);

		List<com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack> trackDtos = tracks.getContent().stream()
			.map(this::convertToTrackDto)
			.collect(Collectors.toList());
		response.setItems(trackDtos);

		return response;
	}

	/**
	 * 플레이리스트에 트랙 추가
	 */
	@Transactional
	public Object addTracksToPlaylist(UserPrincipal auth, Long playlistId, AddTracksToCustomPlaylistRequest request) {
		log.info("플레이리스트 트랙 추가 - userId: {}, playlistId: {}, trackCount: {}",
			auth.userId(), playlistId, request.getUris().size());

		CustomPlaylist playlist = playlistRepository.findByIdAndUserId(playlistId, auth.userId())
			.orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));

		int addedCount = 0;
		int skippedCount = 0;
		int invalidCount = 0;

		for (String uri : request.getUris()) {
			String songId = extractSongIdFromUri(uri);

			// Song 존재성 검증
			if (!songRepository.existsById(songId)) {
				log.warn("존재하지 않는 Song ID - songId: {}", songId);
				invalidCount++;
				continue;
			}

			if (!trackRepository.existsByPlaylistIdAndSongId(playlistId, songId)) {
				// 트랙 추가
				com.sevencode.speakle.playlist.entity.CustomPlaylistTrack track = new com.sevencode.speakle.playlist.entity.CustomPlaylistTrack(
					playlistId, auth.userId(), songId);
				trackRepository.save(track);
				addedCount++;
			} else {
				skippedCount++;
			}
		}

		String message = String.format("추가: %d개, 중복: %d개, 유효하지 않음: %d개", addedCount, skippedCount, invalidCount);

		return Map.of(
			"snapshot_id", "custom_" + System.currentTimeMillis(),
			"custom", true,
			"message", message,
			"added_count", addedCount,
			"skipped_count", skippedCount,
			"invalid_count", invalidCount
		);
	}

	/**
	 * 플레이리스트에서 트랙 삭제
	 */
	@Transactional
	public Object removeTracksFromPlaylist(UserPrincipal auth, Long playlistId, RemoveTracksFromCustomPlaylistRequest request) {
		log.info("플레이리스트 트랙 삭제 - userId: {}, playlistId: {}, trackCount: {}",
			auth.userId(), playlistId, request.getTracks().size());

		CustomPlaylist playlist = playlistRepository.findByIdAndUserId(playlistId, auth.userId())
			.orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));

		for (RemoveTracksFromCustomPlaylistRequest.TrackToRemove trackToRemove : request.getTracks()) {
			String songId = extractSongIdFromUri(trackToRemove.getUri());
			trackRepository.deleteByPlaylistIdAndSongId(playlistId, songId);
		}

		return Map.of(
			"snapshot_id", "custom_" + System.currentTimeMillis(),
			"custom", true,
			"message", "트랙이 플레이리스트에서 삭제되었습니다."
		);
	}

	// === Private Helper Methods ===

	private CustomPlaylistResponse convertToResponse(CustomPlaylist playlist, UserPrincipal auth) {
		CustomPlaylistResponse dto = new CustomPlaylistResponse();
		dto.setId(playlist.getId().toString());
		dto.setName(playlist.getName());
		dto.setDescription(playlist.getDescription());
		dto.setIsPublic(playlist.getIsPublic());
		dto.setCollaborative(playlist.getCollaborative());
		dto.setUri("custom:playlist:" + playlist.getId());
		dto.setCustom(true);
		// Spotify synced 정보는 현재 엔티티에 없으므로 기본값 설정
		dto.setSpotifySynced(false);

		// Owner 정보
		CustomPlaylistResponse.Owner owner = new CustomPlaylistResponse.Owner();
		owner.setId(auth.userId().toString());
		owner.setDisplayName(auth.getUsername()); // 또는 실제 사용자 이름
		owner.setUri("custom:user:" + auth.userId());
		dto.setOwner(owner);

		// Tracks 정보
		CustomPlaylistResponse.TracksInfo tracks = new CustomPlaylistResponse.TracksInfo();
		tracks.setHref("/api/custom-playlists/" + playlist.getId() + "/tracks");
		tracks.setTotal(playlist.getTrackCount());
		dto.setTracks(tracks);

		// External URLs
		CustomPlaylistResponse.ExternalUrls externalUrls = new CustomPlaylistResponse.ExternalUrls();
		externalUrls.setSpotify(null); // 자체 플레이리스트는 Spotify URL 없음
		dto.setExternalUrls(externalUrls);

		return dto;
	}

	private com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack convertToTrackDto(com.sevencode.speakle.playlist.entity.CustomPlaylistTrack track) {
		com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack dto = new com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack();

		// 추가 날짜를 사용자 친화적인 형식으로 포맷팅 (YY-MM-DD)
		dto.setAddedAt(track.getAddedAt().atZone(ZoneId.systemDefault())
			.format(DateTimeFormatter.ofPattern("yy-MM-dd")));

		com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Track trackInfo = new com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Track();
		trackInfo.setId(track.getSongId());

		// Song 정보 조회
		Song song = songRepository.findById(track.getSongId()).orElse(null);

		if (song != null) {
			// 실제 Song 정보 사용
			trackInfo.setName(song.getTitle());

			// Duration 정보 확인 및 로깅
			if (song.getDurationMs() != null) {
				trackInfo.setDurationMs(song.getDurationMs().intValue());

				// 사용자 친화적인 시간 형식 추가 (예: 3:43)
				int totalSeconds = (int) (song.getDurationMs() / 1000);
				int minutes = totalSeconds / 60;
				int seconds = totalSeconds % 60;
				String formattedDuration = String.format("%d:%02d", minutes, seconds);
				trackInfo.setDurationFormatted(formattedDuration);

				log.debug("Song duration found - songId: {}, duration: {}ms ({})", track.getSongId(), song.getDurationMs(), formattedDuration);
			} else {
				trackInfo.setDurationMs(180000); // 3분 기본값
				trackInfo.setDurationFormatted("3:00");
				log.debug("Song duration is null - songId: {}, using default 180000ms (3:00)", track.getSongId());
			}

			// Artist 정보 (여러 아티스트가 쉼표로 구분되어 저장되어 있을 수 있음)
			if (song.getArtists() != null && !song.getArtists().trim().isEmpty()) {
				String[] artistNames = song.getArtists().split(",");
				List<com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Artist> artists =
					Stream.of(artistNames)
						.map(name -> {
							com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Artist artist =
								new com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Artist();
							artist.setName(name.trim());
							return artist;
						})
						.collect(Collectors.toList());
				trackInfo.setArtists(artists);
			} else {
				// Artist 정보가 없는 경우 기본값
				com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Artist artist =
					new com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Artist();
				artist.setName("Unknown Artist");
				trackInfo.setArtists(List.of(artist));
			}

			// Album 정보
			com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Album album =
				new com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Album();
			album.setName(song.getAlbum() != null ? song.getAlbum() : "Unknown Album");

			// Album 이미지가 있는 경우 추가
			if (song.getAlbumImgUrl() != null && !song.getAlbumImgUrl().trim().isEmpty()) {
				com.sevencode.speakle.playlist.dto.response.CustomPlaylistResponse.Image image =
					new com.sevencode.speakle.playlist.dto.response.CustomPlaylistResponse.Image();
				image.setUrl(song.getAlbumImgUrl());
				album.setImages(List.of(image));
			}
			trackInfo.setAlbum(album);

		} else {
			// Song을 찾을 수 없는 경우 기본값 설정
			log.warn("Song을 찾을 수 없음 - songId: {}", track.getSongId());
			trackInfo.setName("Unknown Song (" + track.getSongId() + ")");
			trackInfo.setDurationMs(180000); // 3분 기본값
			trackInfo.setDurationFormatted("3:00");

			// Artist 정보 (기본값)
			com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Artist artist =
				new com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Artist();
			artist.setName("Unknown Artist");
			trackInfo.setArtists(List.of(artist));

			// Album 정보 (기본값)
			com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Album album =
				new com.sevencode.speakle.playlist.dto.response.CustomPlaylistTrack.Album();
			album.setName("Unknown Album");
			trackInfo.setAlbum(album);
		}

		trackInfo.setUri("custom:track:" + track.getSongId());
		dto.setTrack(trackInfo);
		return dto;
	}

	private String extractSongIdFromUri(String uri) {
		if (uri == null || uri.trim().isEmpty()) {
			throw new IllegalArgumentException("URI가 비어있습니다.");
		}

		try {
			// URI 형태별 처리
			if (uri.startsWith("spotify:track:")) {
				// spotify:track:2gFvRmQiWg9fN9i74Q0aiw -> 2gFvRmQiWg9fN9i74Q0aiw
				return uri.substring("spotify:track:".length());

			} else if (uri.startsWith("custom:track:")) {
				// custom:track:123 -> 123
				return uri.substring("custom:track:".length());

			} else if (uri.contains(":")) {
				// 기타 형태의 URI에서 마지막 부분 추출
				return uri.substring(uri.lastIndexOf(":") + 1);

			} else {
				// URI 형태가 아닌 경우 그대로 반환 (이미 trackId인 경우)
				return uri;
			}

		} catch (Exception e) {
			log.error("URI 파싱 실패 - uri: {}, error: {}", uri, e.getMessage());
			throw new IllegalArgumentException("유효하지 않은 URI 형태입니다: " + uri, e);
		}
	}

	/**
	 * 정렬 옵션에 따라 트랙을 조회하는 헬퍼 메서드
	 */
	private Page<com.sevencode.speakle.playlist.entity.CustomPlaylistTrack> getTracksBySortOption(
		Long playlistId, Pageable pageable, String sortBy, String order) {

		// 기본값 설정
		if (sortBy == null) sortBy = "addedAt";
		if (order == null) order = "asc";

		switch (sortBy.toLowerCase()) {
			case "addedAt":
			case "added_at":
				return "desc".equalsIgnoreCase(order)
					? trackRepository.findByPlaylistIdOrderByAddedAtDesc(playlistId, pageable)
					: trackRepository.findByPlaylistIdOrderByAddedAt(playlistId, pageable);

			case "playCount":
			case "play_count":
				return "asc".equalsIgnoreCase(order)
					? trackRepository.findByPlaylistIdOrderByPlayCountAsc(playlistId, pageable)
					: trackRepository.findByPlaylistIdOrderByPlayCountDesc(playlistId, pageable);

			default:
				// 기본값: 추가 순
				return trackRepository.findByPlaylistIdOrderByAddedAt(playlistId, pageable);
		}
	}

}
