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
import com.sevencode.speakle.learn.repository.LearningSentenceRepository;
import com.sevencode.speakle.learn.domain.entity.LearningSentence;
import com.sevencode.speakle.parser.service.LyricsParsingService;
import com.sevencode.speakle.parser.service.ContextAwareLyricTranslationService;
import com.sevencode.speakle.parser.repository.SentenceRepository;
import com.sevencode.speakle.parser.entity.SentenceEntity;
import com.sevencode.speakle.playlist.service.CustomPlaylistService;
import com.sevencode.speakle.spotify.service.SpotifyService;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
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
    private final LearnedSongRepository learnedSongRepository;
    private final LearningSentenceService learningSentenceService;
    private final LyricsParsingService lyricsParsingService;
    private final ContextAwareLyricTranslationService contextAwareLyricTranslationService;
    private final LearningSentenceRepository learningSentenceRepository;
    private final SpotifyService spotifyService;
    private final SentenceRepository sentenceRepository;
    private final CustomPlaylistService customPlaylistService;

    // 노래 리스트 (페이징)
    public Page<SongResponse> getSongs(Pageable pageable) {
        log.info("[SongService] 노래 리스트 조회 요청 page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Song> songs = songRepository.findAll(pageable);

        log.info("[SongService] 노래 리스트 조회 성공 - 조회된 개수: {}", songs.getTotalElements());

        return songs.map(this::toSongResponse);
    }

    // POST 방식 노래 검색
    public Page<SongResponse> searchSongs(SongSearchRequest request) {
        log.info("[SongService] POST 노래 검색 요청 page={}, size={}, sort={}, keyword={}",
                request.getPage(), request.getSize(), request.getSort(), request.getKeyword());

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

        // 키워드가 있으면 제목/아티스트로 검색, 없으면 전체 조회
        Page<Song> songs;
        if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
            songs = songRepository.findByTitleOrArtistsContainingIgnoreCase(request.getKeyword().trim(), pageable);
            log.info("[SongService] POST 노래 검색 성공 (키워드: '{}') - 조회된 개수: {}",
                    request.getKeyword(), songs.getTotalElements());
        } else {
            songs = songRepository.findAll(pageable);
            log.info("[SongService] POST 노래 전체 조회 성공 - 조회된 개수: {}", songs.getTotalElements());
        }

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

    // 노래 상세 (기존 - 하위 호환성)
    public SongDetailResponse getSongDetail(String songId) {
        return getSongDetail(songId, null, null);
    }

	/*
		기존 getSongDetail
	    // 노래 상세 (situation, location 포함)
    public SongDetailResponse getSongDetail(String songId, String situation, String location) {
        log.info("[SongService] 노래 상세 조회 요청 songId={}, situation={}, location={}", songId, situation, location);
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> {
                    log.error("[SongService] 노래 상세 조회 실패 - 존재하지 않는 songId={}", songId);
                    return new RuntimeException("노래를 찾을 수 없습니다. id=" + songId);
                });

        // Parser 데이터 비동기 처리 (캐시 우선, 없으면 백그라운드에서 생성)
        ensureParsingDataExistsAsync(songId, situation, location);

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

	 */

    // 노래 상세 (situation, location 포함)
    public SongDetailResponse getSongDetail(String songId, String situation, String location) {
        log.info("[SongService] 노래 상세 조회 요청 songId={}, situation={}, location={}", songId, situation, location);
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> {
                    log.error("[SongService] 노래 상세 조회 실패 - 존재하지 않는 songId={}", songId);
                    return new RuntimeException("노래를 찾을 수 없습니다. id=" + songId);
                });

        // Parser 데이터 비동기 처리 (캐시 우선, 없으면 백그라운드에서 생성)
        ensureParsingDataExistsAsync(songId, situation, location);

        // 컨텍스트 기반 가사 실시간 번역 백그라운드 처리 (Redis PubSub + WebSocket)
        // 단, 번역이 필요한 청크가 있을 때만 실행
        boolean hasUntranslatedChunks = lyricChunkRepository.findBySong(song).stream()
                .anyMatch(c -> c.getEnglish() != null && !c.getEnglish().trim().isEmpty()
                             && (c.getKorean() == null || c.getKorean().trim().isEmpty()));

        if (hasUntranslatedChunks) {
            log.info("[SongService] 번역이 필요한 청크 발견 - 실시간 번역 시작, songId={}", songId);
			// 테스트 끝나고 배포 후 주석 해제 (토큰 사용 때문에 주석처리)
//             contextAwareLyricTranslationService.translateSongChunksRealtime(
//                     songId, song.getTitle(), song.getArtists(), song.getAlbum()
//             );
        } else {
            log.info("[SongService] 모든 번역 완료됨 - 번역 서비스 스킵, songId={}", songId);
        }

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

        // 디버깅용 로그 추가
        log.debug("[DEBUG] Request situation is null? {}", request.getSituation() == null);
        log.debug("[DEBUG] Request location is null? {}", request.getLocation() == null);
        log.debug("[DEBUG] Request situation value: '{}'", request.getSituation());
        log.debug("[DEBUG] Request location value: '{}'", request.getLocation());

        // 곡 존재 여부 검증
        Song song = songRepository.findById(request.getSongId())
                .orElseThrow(() -> {
                    log.error("[SongService] 학습곡 저장 실패 - 존재하지 않는 곡 songId={}", request.getSongId());
                    return new RuntimeException("존재하지 않는 곡입니다. songId=" + request.getSongId());
                });

        log.debug("[SongService] 곡 검증 완료 - title={}, artists={}", song.getTitle(), song.getArtists());

        // 수정(아윤) - LearnedSongEntity 중복 확인
        Optional<LearnedSongEntity> existing = learnedSongRepository
                .findByUserIdAndSongIdAndSituationAndLocation(
                        userId, request.getSongId(), request.getSituation(), request.getLocation());

        LearnedSongEntity learnedSong;

        if (existing.isPresent()) {
            // 이미 존재하는 데이터 사용
            learnedSong = existing.get();
            log.info("[SongService] 이미 존재하는 학습곡 - learnedSongId={}, userId={}, songId={}, situation={}, location={}",
                    learnedSong.getLearnedSongId(), userId, learnedSong.getSongId(),
                    learnedSong.getSituation(), learnedSong.getLocation());

            return SaveLearnedSongResponse.builder()
                    .learnedSongId(learnedSong.getLearnedSongId())
                    .songId(learnedSong.getSongId()) // String 그대로 반환 (타입이 이미 String임)
                    .situation(learnedSong.getSituation())
                    .location(learnedSong.getLocation())
                    .build();
        }else{
            // 수정(소연) - LearnedSongEntity 생성 (artists는 List<String>으로 변환)
            learnedSong = new LearnedSongEntity();
            learnedSong.setUserId(userId);
            learnedSong.setSongId(request.getSongId()); // String 그대로 사용
            learnedSong.setArtists(song.getArtists()); // String 그대로 사용
            learnedSong.setSituation(request.getSituation());
            learnedSong.setLocation(request.getLocation());

            try {
                LearnedSongEntity saved = learnedSongRepository.save(learnedSong);
                log.info("[SongService] 학습곡 저장 성공 - learnedSongId={}, userId={}, songId={}",
                        saved.getLearnedSongId(), userId, saved.getSongId());

                // Parser 데이터 확인 및 LLM 파싱 수행 (동기적으로 처리)
                // songId를 사용해야 함 (learnedSongId가 아님)
                ensureParsingDataExists(saved.getSongId(), request.getSituation(), request.getLocation());

                // 핵심 학습 문장들을 learning_sentence 테이블에 저장
                try {
                    List<SentenceEntity> sentences = sentenceRepository.findAllBySongIdAndSituationAndLocation(saved.getSongId(), request.getSituation(), request.getLocation());

                    if (!sentences.isEmpty()) {
                        List<String> coreSentences = sentences.stream()
                                .map(SentenceEntity::getSentence)
                                .filter(sentence -> sentence != null && !sentence.trim().isEmpty())
                                .toList();

                        List<String> koreanTranslations = sentences.stream()
                                .map(SentenceEntity::getTranslation)
                                .toList();

                        learningSentenceService.saveLearningSentences(userId, saved.getLearnedSongId(), coreSentences, koreanTranslations);
                        log.info("[SongService] 핵심 학습 문장 저장 완료 - 문장 수: {}", coreSentences.size());
                    } else {
                        log.warn("[SongService] 파싱된 문장을 찾을 수 없음 - songId={}", saved.getSongId());
                    }
                } catch (Exception e) {
                    log.error("[SongService] 학습 문장 저장 중 오류 - error={}", e.getMessage(), e);
                }


                return SaveLearnedSongResponse.builder()
                        .learnedSongId(saved.getLearnedSongId())
                        .songId(saved.getSongId()) // String 그대로 반환 (타입이 이미 String임)
                        .situation(saved.getSituation())
                        .location(saved.getLocation())
                        .build();
            } catch (Exception e) {
                log.error("[SongService] 학습곡 저장 중 오류 발생 - userId={}, songId={}, error={}",
                        userId, request.getSongId(), e.getMessage(), e);
                throw new RuntimeException("학습곡 저장에 실패했습니다.", e);
            }
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
                .durationMs(song.getDurationMs())
                .albumImgUrl(song.getAlbumImgUrl())
                .popularity(song.getPopularity())
                .level(song.getLevel())
                .build();
    }

    /**
     * Parser 데이터 존재 여부 확인 및 LLM 파싱 수행 (동기적)
     * @param songId 곡 ID (String)
     * @param situation 상황
     * @param location 장소
     */
    private void ensureParsingDataExists(String songId, String situation, String location) {
        log.info("[SongService] Parser 데이터 확인 시작 - songId={}, situation={}, location={}",
                songId, situation, location);

        try {
            // Context-aware 파싱 데이터 존재 여부 확인 및 생성 (동기적으로 실행)
            lyricsParsingService.parseAndSaveBySongIdWithContext(songId, situation, location)
                    .doOnSuccess(result -> {
                        log.info("[SongService] Parser 데이터 준비 완료 - songId={}, words={}, expressions={}, idioms={}, sentences={}",
                                songId,
                                result.get("words").size(),
                                result.get("expressions").size(),
                                result.get("idioms").size(),
                                result.get("sentences").size());
                    })
                    .doOnError(error -> {
                        log.error("[SongService] Parser 데이터 생성 실패 - songId={}, error={}",
                                songId, error.getMessage(), error);
                    })
                    .block(); // 동기적으로 완료 대기

            log.info("[SongService] Parser 데이터 확인 완료 - songId={}", songId);
        } catch (Exception e) {
            log.error("[SongService] Parser 데이터 확인 중 예외 발생 - songId={}, error={}",
                    songId, e.getMessage(), e);
            // 파싱 실패해도 학습곡 저장은 성공으로 처리 (게임에서 더미 데이터 사용 가능)
        }
    }

    /**
     * Parser 데이터 비동기 처리 (캐시 우선 전략)
     * @param songId 곡 ID (String)
     * @param situation 상황
     * @param location 장소
     */
    private void ensureParsingDataExistsAsync(String songId, String situation, String location) {
        log.info("[SongService] Parser 데이터 비동기 처리 시작 - songId={}, situation={}, location={}",
                songId, situation, location);

        // 비동기로 Parser 데이터 처리 (캐시 있으면 즉시 반환, 없으면 백그라운드 생성)
        lyricsParsingService.parseAndSaveBySongIdWithContext(songId, situation, location)
                .doOnSuccess(result -> {
                    log.info("[SongService] Parser 데이터 비동기 처리 완료 - songId={}, words={}, expressions={}, idioms={}, sentences={}",
                            songId,
                            result.get("words").size(),
                            result.get("expressions").size(),
                            result.get("idioms").size(),
                            result.get("sentences").size());
                })
                .doOnError(error -> {
                    log.error("[SongService] Parser 데이터 비동기 처리 실패 - songId={}, error={}",
                            songId, error.getMessage(), error);
                })
                .subscribe(); // 비동기 실행 (결과 기다리지 않음)
    }

    /**
     * 특정 곡의 앨범 이미지를 Spotify에서 가져와서 업데이트합니다.
     * 수정(소연)
     *
     * @param songId 곡 ID
     * @return 업데이트 성공 여부
     */
    public boolean updateAlbumImageFromSpotify(String songId) {
        try {
            Optional<Song> songOpt = songRepository.findById(songId);
            if (songOpt.isEmpty()) {
                log.warn("곡을 찾을 수 없습니다 - songId: {}", songId);
                return false;
            }

            Song song = songOpt.get();

            // 이미 앨범 이미지가 있고 유효한 URL인 경우 스킵
            if (song.getAlbumImgUrl() != null &&
                song.getAlbumImgUrl().startsWith("https://") &&
                song.getAlbumImgUrl().contains("spotify")) {
                log.info("이미 Spotify 앨범 이미지가 있습니다 - songId: {}", songId);
                return true;
            }

            String newImageUrl = spotifyService.getAlbumImageUrl(song.getTitle(), song.getArtists());
            if (newImageUrl != null) {
                song.setAlbumImgUrl(newImageUrl);
                songRepository.save(song);
                log.info("앨범 이미지 업데이트 성공 - songId: {}, url: {}", songId, newImageUrl);
                return true;
            } else {
                log.warn("Spotify에서 앨범 이미지를 찾을 수 없습니다 - songId: {}, title: {}, artist: {}",
                        songId, song.getTitle(), song.getArtists());
                return false;
            }

        } catch (Exception e) {
            log.error("앨범 이미지 업데이트 실패 - songId: {}", songId, e);
            return false;
        }
    }

    /**
     * 모든 곡의 앨범 이미지를 Spotify에서 가져와서 업데이트합니다.
     * 수정(소연)
     *
     * @param limit 처리할 곡 수 제한 (null이면 전체)
     * @return 업데이트 성공한 곡 수
     */
    public int updateAllAlbumImagesFromSpotify(Integer limit) {
        try {
            Pageable pageable = limit != null ?
                PageRequest.of(0, limit) :
                PageRequest.of(0, Integer.MAX_VALUE);

            // 앨범 이미지가 없거나 Spotify URL이 아닌 곡들을 우선적으로 처리
            Page<Song> songsPage = songRepository.findByAlbumImgUrlIsNullOrAlbumImgUrlNotLike("https://i.scdn.co%", pageable);

            int successCount = 0;
            int totalCount = songsPage.getContent().size();

            log.info("앨범 이미지 일괄 업데이트 시작 - 총 {}곡", totalCount);

            for (Song song : songsPage.getContent()) {
                try {
                    String newImageUrl = spotifyService.getAlbumImageUrl(song.getTitle(), song.getArtists());
                    if (newImageUrl != null) {
                        song.setAlbumImgUrl(newImageUrl);
                        songRepository.save(song);
                        successCount++;
                        log.info("앨범 이미지 업데이트 성공 ({}/{}) - songId: {}",
                                successCount, totalCount, song.getSongId());
                    }

                    // API 레이트 리밋을 피하기 위한 딜레이
                    Thread.sleep(100); // 100ms 대기

                } catch (Exception e) {
                    log.error("개별 곡 앨범 이미지 업데이트 실패 - songId: {}", song.getSongId(), e);
                }
            }

            log.info("앨범 이미지 일괄 업데이트 완료 - 성공: {}/{}", successCount, totalCount);
            return successCount;

        } catch (Exception e) {
            log.error("앨범 이미지 일괄 업데이트 실패", e);
            return 0;
        }
    }

    /**
     * 앨범 이미지가 없는 곡들의 개수를 반환합니다.
     * 수정(소연)
     *
     * @return 앨범 이미지가 없는 곡 수
     */
    public long countSongsWithoutAlbumImage() {
        return songRepository.countByAlbumImgUrlIsNullOrAlbumImgUrlNotLike("https://i.scdn.co%");
    }

}
