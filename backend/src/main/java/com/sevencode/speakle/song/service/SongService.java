package com.sevencode.speakle.song.service;

import com.sevencode.speakle.song.domain.LearnedSong;
import com.sevencode.speakle.song.domain.Song;
import com.sevencode.speakle.song.dto.request.SaveLearnedSongRequest;
import com.sevencode.speakle.song.dto.response.LyricChunkResponse;
import com.sevencode.speakle.song.dto.response.SaveLearnedSongResponse;
import com.sevencode.speakle.song.dto.response.SongDetailResponse;
import com.sevencode.speakle.song.dto.response.SongResponse;
import com.sevencode.speakle.song.repository.LearnedSongRepository;
import com.sevencode.speakle.song.repository.LyricChunkRepository;
import com.sevencode.speakle.song.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SongService {

    private final SongRepository songRepository;
    private final LyricChunkRepository lyricChunkRepository;
    private final LearnedSongRepository learnedSongRepository;

    // 노래 리스트 (페이징)
    public Page<SongResponse> getSongs(Pageable pageable) {
        log.info("[SongService] 노래 리스트 조회 요청 page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Song> songs = songRepository.findAll(pageable);

        log.info("[SongService] 노래 리스트 조회 성공 - 조회된 개수: {}", songs.getTotalElements());

        return songs.map(this::toSongResponse);
    }

    // 노래 상세
    public SongDetailResponse getSongDetail(String songId) {
        log.info("[SongService] 노래 상세 조회 요청 songId={}", songId);
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> {
                    log.error("[SongService] 노래 상세 조회 실패 - 존재하지 않는 songId={}", songId);
                    return new RuntimeException("노래를 찾을 수 없습니다. id=" + songId);
                });

        List<LyricChunkResponse> chunks = lyricChunkRepository.findBySong(song).stream()
                .map(c -> LyricChunkResponse.builder()
                        .id(c.getSongsLyricsId())
                        .startTimeMs(c.getStartTimeMs())
                        .english(c.getEnglish())
                        .korean(c.getKorean())
                        .build())
                .toList();
        log.info("[SongService] 노래 상세 조회 성공 songId={}, lyricChunks={}", songId, chunks.size());

        return SongDetailResponse.builder()
                .songId(song.getSongId())
                .title(song.getTitle())
                .artists(song.getArtists())
                .album(song.getAlbum())
                .albumImgUrl(song.getAlbumImgUrl())
                .popularity(song.getPopularity())
                .durationMs(song.getDurationMs())
                .lyrics(song.getLyrics())
                .lyricChunks(chunks)
                .build();
    }

    // 학습하기 버튼 클릭 시 저장
    public SaveLearnedSongResponse saveLearnedSong(Long userId, SaveLearnedSongRequest request) {
        log.info("[SongService] 학습곡 저장 요청 userId={}, songId={}", userId, request.getSongId());

        LearnedSong learnedSong = LearnedSong.builder()
                .userId(userId)
                .songId(request.getSongId())
                .situation(request.getSituation())
                .location(request.getLocation())
                .build();

        LearnedSong saved = learnedSongRepository.save(learnedSong);

        log.info("[SongService] 학습곡 저장 성공 learnedSongId={}, songId={}", saved.getLearnedSongId(), saved.getSongId());

        return SaveLearnedSongResponse.builder()
                .learnedSongId(saved.getLearnedSongId())
                .songId(saved.getSongId())
                .situation(saved.getSituation())
                .location(saved.getLocation())
                .build();
    }

    private SongResponse toSongResponse(Song song) {
        return SongResponse.builder()
                .songId(song.getSongId())
                .title(song.getTitle())
                .artists(song.getArtists())
                .albumImgUrl(song.getAlbumImgUrl())
                .popularity(song.getPopularity())
                .level(song.getLevel())
                .build();
    }


}
