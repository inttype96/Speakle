package com.sevencode.speakle.song.service;

// 수정(소연) - learn 패키지의 LearnedSongEntity 사용
import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import com.sevencode.speakle.song.domain.Song;
import com.sevencode.speakle.song.dto.request.SaveLearnedSongRequest;
import com.sevencode.speakle.song.dto.request.SongSearchRequest;
import com.sevencode.speakle.song.dto.response.LyricChunkResponse;
import com.sevencode.speakle.song.dto.response.SaveLearnedSongResponse;
import com.sevencode.speakle.song.dto.response.SongDetailResponse;
import com.sevencode.speakle.song.dto.response.SongResponse;
// 수정(소연) - learn 패키지의 LearnedSongRepository 사용
import com.sevencode.speakle.learn.repository.LearnedSongRepository;
import com.sevencode.speakle.learn.service.LearningSentenceService;
import com.sevencode.speakle.song.repository.LyricChunkRepository;
import com.sevencode.speakle.song.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SongService {

    private final SongRepository songRepository;
    private final LyricChunkRepository lyricChunkRepository;
    // 수정(소연) - learn 패키지의 LearnedSongRepository 추가
    private final LearnedSongRepository learnedSongRepository;
    private final LearningSentenceService learningSentenceService;

    // 노래 리스트 (페이징)
    public Page<SongResponse> getSongs(Pageable pageable) {
        log.info("[SongService] 노래 리스트 조회 요청 page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Song> songs = songRepository.findAll(pageable);

        log.info("[SongService] 노래 리스트 조회 성공 - 조회된 개수: {}", songs.getTotalElements());

        return songs.map(this::toSongResponse);
    }

    // POST 방식 노래 검색
    public Page<SongResponse> searchSongs(SongSearchRequest request) {
        log.info("[SongService] POST 노래 검색 요청 page={}, size={}, sort={}",
                request.getPage(), request.getSize(), request.getSort());

        // Sort 객체 생성
        Sort sort = Sort.unsorted();
        if (request.getSort() != null && !request.getSort().isEmpty()) {
            Sort.Order[] orders = request.getSort().stream()
                    .map(this::parseSort)
                    .toArray(Sort.Order[]::new);
            sort = Sort.by(orders);
        }

        // Pageable 생성
        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);

        Page<Song> songs = songRepository.findAll(pageable);
        log.info("[SongService] POST 노래 검색 성공 - 조회된 개수: {}", songs.getTotalElements());

        return songs.map(this::toSongResponse);
    }

    private Sort.Order parseSort(String sortString) {
        // "popularity,desc" -> Sort.Order.desc("popularity")
        // "title,asc" -> Sort.Order.asc("title")
        // "popularity" -> Sort.Order.asc("popularity") (기본값)

        String[] parts = sortString.split(",");
        String property = parts[0].trim();

        if (parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())) {
            return Sort.Order.desc(property);
        } else {
            return Sort.Order.asc(property);
        }
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

    // 수정(소연) - LearnedSongEntity를 사용한 실제 학습곡 저장 구현
    public SaveLearnedSongResponse saveLearnedSong(Long userId, SaveLearnedSongRequest request) {
        log.info("[SongService] 학습곡 저장 요청 - userId={}, songId={}, situation={}, location={}",
                userId, request.getSongId(), request.getSituation(), request.getLocation());

        // 곡 존재 여부 검증
        Song song = songRepository.findById(request.getSongId())
                .orElseThrow(() -> {
                    log.error("[SongService] 학습곡 저장 실패 - 존재하지 않는 곡 songId={}", request.getSongId());
                    return new RuntimeException("존재하지 않는 곡입니다. songId=" + request.getSongId());
                });

        log.debug("[SongService] 곡 검증 완료 - title={}, artists={}", song.getTitle(), song.getArtists());

        // 수정(소연) - LearnedSongEntity 생성 (artists는 List<String>으로 변환)
        LearnedSongEntity learnedSong = new LearnedSongEntity();
        learnedSong.setUserId(userId);
        learnedSong.setSongId(request.getSongId()); // String 그대로 사용
        learnedSong.setArtists(java.util.Arrays.asList(song.getArtists().split(",\\s*"))); // String을 List<String>으로 변환
        learnedSong.setSituation(request.getSituation());
        learnedSong.setLocation(request.getLocation());

        try {
            LearnedSongEntity saved = learnedSongRepository.save(learnedSong);
            log.info("[SongService] 학습곡 저장 성공 - learnedSongId={}, userId={}, songId={}",
                    saved.getLearnedSongId(), userId, saved.getSongId());

            return SaveLearnedSongResponse.builder()
                    .learnedSongId(saved.getLearnedSongId())
                    .songId(String.valueOf(saved.getSongId())) // Long을 String으로 변환
                    .situation(saved.getSituation())
                    .location(saved.getLocation())
                    .build();
        } catch (Exception e) {
            log.error("[SongService] 학습곡 저장 중 오류 발생 - userId={}, songId={}, error={}",
                    userId, request.getSongId(), e.getMessage(), e);
            throw new RuntimeException("학습곡 저장에 실패했습니다.", e);
        }
    }

//    public SaveLearnedSongResponse saveLearnedSong(Long userId, SaveLearnedSongRequest request) {
//        log.info("[SongService] 학습곡 저장 요청 - userId={}, songId={}, situation={}, location={}",
//                userId, request.getSongId(), request.getSituation(), request.getLocation());
//
//        // 곡 존재 여부 검증
//        Song song = songRepository.findById(request.getSongId())
//                .orElseThrow(() -> {
//                    log.error("[SongService] 학습곡 저장 실패 - 존재하지 않는 곡 songId={}", request.getSongId());
//                    return new RuntimeException("존재하지 않는 곡입니다. songId=" + request.getSongId());
//                });
//
//        log.debug("[SongService] 곡 검증 완료 - title={}, artists={}", song.getTitle(), song.getArtists());
//
//        LearnedSong learnedSong = LearnedSong.builder()
//                .userId(userId)
//                .songId(request.getSongId())
//                .artists(song.getArtists()) // 곡 정보에서 아티스트 설정
//                .situation(request.getSituation())
//                .location(request.getLocation())
//                .build();
//
//        try {
//            LearnedSong saved = learnedSongRepository.save(learnedSong);
//            log.info("[SongService] 학습곡 저장 성공 - learnedSongId={}, userId={}, songId={}",
//                    saved.getLearnedSongId(), userId, saved.getSongId());
//
//            return SaveLearnedSongResponse.builder()
//                    .learnedSongId(saved.getLearnedSongId())
//                    .songId(saved.getSongId())
//                    .situation(saved.getSituation())
//                    .location(saved.getLocation())
//                    .build();
//        } catch (Exception e) {
//            log.error("[SongService] 학습곡 저장 중 오류 발생 - userId={}, songId={}, error={}",
//                    userId, request.getSongId(), e.getMessage(), e);
//            throw new RuntimeException("학습곡 저장에 실패했습니다.", e);
//        }
//    }

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
