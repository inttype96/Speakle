package com.sevencode.speakle.spotify.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sevencode.speakle.spotify.entity.SpotifyPlaylist;

@Repository
public interface SpotifyPlaylistRepository extends JpaRepository<SpotifyPlaylist, Long> {
}
