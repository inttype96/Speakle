package com.sevencode.speakle.spotify.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.sevencode.speakle.spotify.entity.SpotifyAccount;

@Repository
public interface SpotifyAccountRepository extends JpaRepository<SpotifyAccount, Long> {

	Optional<SpotifyAccount> findByUserId(Long userId);

	@Modifying
	@Transactional
	@Query("DELETE FROM SpotifyAccount s WHERE s.userId = :userId")
	void deleteByUserId(@Param("userId") Long userId);
}
