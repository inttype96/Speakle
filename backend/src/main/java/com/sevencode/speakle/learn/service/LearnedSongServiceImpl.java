package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import com.sevencode.speakle.learn.dto.response.LearnedSongInfoResponse;
import com.sevencode.speakle.learn.dto.response.LearnedSongResponse;
import com.sevencode.speakle.learn.dto.response.RecentLearnedSongsResponse;
import com.sevencode.speakle.learn.exception.MemberNotFoundException;
import com.sevencode.speakle.learn.repository.LearnedSongRepository;
import com.sevencode.speakle.learn.repository.MemberAuthRepository;
import com.sevencode.speakle.song.domain.Song;
import com.sevencode.speakle.song.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class LearnedSongServiceImpl implements LearnedSongService {

    private final LearnedSongRepository learnedSongRepository;
    private final SongRepository songRepository;
    private final MemberAuthRepository memberAuthRepository;

    /**
     * 최근 학습한 곡 목록 조회
     */
    @Override
    public RecentLearnedSongsResponse getRecentLearnedSongs(Long userId, int page, int size) {
        // 1. 사용자 존재 여부 확인
        if(!memberAuthRepository.existsByIdAndDeletedFalse(userId)){
            throw new MemberNotFoundException("존재하지 않는 회원입니다.");
        }

        // 2. 사용자의 학습 기록이 있는지 확인
        if (!learnedSongRepository.existsByUserId(userId)) {
            RecentLearnedSongsResponse.PaginationResponse pagination = new RecentLearnedSongsResponse.PaginationResponse(
                    page,
                    size,
                    0L, // totalItems = 0
                    0,  // totalPages = 0
                    false, // hasPrevious = false
                    false  // hasNext = false
            );

            return new RecentLearnedSongsResponse(
                    Collections.emptyList(), // 빈 배열
                    pagination
            );
        }

        // 3. 페이지네이션 설정
        Pageable pageable = PageRequest.of(page - 1, size); // page는 1부터 시작하므로 -1
        Page<LearnedSongEntity> learnedSongPage = learnedSongRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        // 4. Song 정보 조회를 위한 songId 수집
        List<String> songIds = learnedSongPage.getContent().stream()
                .map(LearnedSongEntity::getSongId)
                .collect(Collectors.toList());

        // 5. Song 정보를 Map으로 변환 (효율적인 조회를 위해)
        Map<String, Song> songMap = songRepository.findAllById(songIds).stream()
                .collect(Collectors.toMap(Song::getSongId, Function.identity()));

        // 6. LearnedSongResponse 변환
        List<LearnedSongResponse> learnedSongs = learnedSongPage.getContent().stream()
                .<LearnedSongResponse>map(learnedSong -> {
                    Song song = songMap.get(learnedSong.getSongId());
                    return this.convertToLearnedSongResponse(learnedSong, song);
                })
                .collect(Collectors.toList());

        // 7. PaginationResponse 생성
        RecentLearnedSongsResponse.PaginationResponse pagination = new RecentLearnedSongsResponse.PaginationResponse(
                learnedSongPage.getNumber() + 1, // 0부터 시작하므로 +1
                learnedSongPage.getSize(),
                learnedSongPage.getTotalElements(),
                learnedSongPage.getTotalPages(),
                learnedSongPage.hasPrevious(),
                learnedSongPage.hasNext()
        );

        return RecentLearnedSongsResponse.builder()
                .learnedSongs(learnedSongs)
                .pagination(pagination)
                .build();
    }

    private LearnedSongResponse convertToLearnedSongResponse(LearnedSongEntity learnedSong, Song song) {
        return LearnedSongResponse.builder()
                .learnedSongId(learnedSong.getLearnedSongId())
                .userId(learnedSong.getUserId())
                .songId(learnedSong.getSongId())
                .artists(song != null ? song.getArtists() : learnedSong.getArtists())
                .title(song != null ? song.getTitle() : null)
                .album(song != null ? song.getAlbum() : null)
                .albumImgUrl(song != null ? song.getAlbumImgUrl() : null)
                .level(song != null && song.getLevel() != null ? song.getLevel().name() : null)
                .danceability(song != null ? song.getDanceability() : null)
                .energy(song != null ? song.getEnergy() : null)
                .key(song != null ? song.getKey() != null ? song.getKey().intValue() : null : null)
                .loudness(song != null ? song.getLoudness() : null)
                .mode(song != null ? song.getMode() != null ? song.getMode().intValue() : null : null)
                .speechiness(song != null ? song.getSpeechiness() : null)
                .acousticness(song != null ? song.getAcousticness() : null)
                .instrumentalness(song != null ? song.getInstrumentalness() : null)
                .liveness(song != null ? song.getLiveness() : null)
                .valence(song != null ? song.getValence() : null)
                .tempo(song != null ? song.getTempo() : null)
                .durationMs(song != null ? song.getDurationMs() != null ? song.getDurationMs().doubleValue() : null : null)
                .lyrics(song != null ? song.getLyrics() : null)
                .createdAt(learnedSong.getCreatedAt())
                .build();
    }

    @Override
    public LearnedSongInfoResponse getSituationAndLocation(Long learnedSongId) {
        Optional<LearnedSongEntity> result = learnedSongRepository.findByLearnedSongId(learnedSongId);
        return LearnedSongInfoResponse.builder()
                .location(result.get().getLocation())
                .situation(result.get().getSituation())
                .build();
    }
}
