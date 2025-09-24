package com.sevencode.speakle.recommend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sevencode.speakle.recommend.client.FastApiClient;
import com.sevencode.speakle.recommend.client.GMSAiClient;
import com.sevencode.speakle.recommend.domain.Recommendation;
import com.sevencode.speakle.recommend.domain.RecommendationLog;
import com.sevencode.speakle.recommend.dto.request.HybridRecommendRequest;
import com.sevencode.speakle.recommend.dto.request.RandomSongRequest;
import com.sevencode.speakle.recommend.dto.response.KeywordsResponse;
import com.sevencode.speakle.recommend.dto.request.QueryRequest;
import com.sevencode.speakle.recommend.dto.response.QueryResponse;
import com.sevencode.speakle.recommend.dto.response.RecommendResponse;
import com.sevencode.speakle.recommend.dto.response.EnhancedRecommendResponse;
import com.sevencode.speakle.recommend.dto.response.RandomSongResponse;
import com.sevencode.speakle.recommend.dto.response.SongMetaResponse;
import com.sevencode.speakle.recommend.dto.request.FilterRequest;
import com.sevencode.speakle.recommend.repository.RecommendationLogRepository;
import com.sevencode.speakle.playlist.repository.CustomPlaylistTrackRepository;
import com.sevencode.speakle.weather.WeatherClient;
import com.sevencode.speakle.song.domain.Song;
import com.sevencode.speakle.song.repository.SongRepository;
import com.sevencode.speakle.learn.repository.LearnHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendService {

    private final FastApiClient fastApiClient;
    private final GMSAiClient gmsAiClient;
    private final RecommendationLogRepository logRepository;
    private final SongRepository songRepository;
    private final LearnHistoryRepository learnHistoryRepository;
    private final RecommendationSentenceService recommendationSentenceService;
    private final ObjectMapper objectMapper;
    private final CustomPlaylistTrackRepository customPlaylistTrackRepository;
    private final WeatherClient weatherClient;

    /* 향상된 상황 + 장소 기반 추천 with 메타데이터 */
    public EnhancedRecommendResponse recommendHybridEnhanced(Long userId, HybridRecommendRequest request, FilterRequest filter) {
        // 기본값 설정
        filter = filter != null ? filter.withDefaults() : new FilterRequest().withDefaults();

        // 1. LLM에서 keywords + phrases + top_k 생성
        KeywordsResponse keywords = gmsAiClient.generateKeywords(
                request.getSituation(),
                request.getLocation(),
                "gpt-4o-mini"
        );

        // 2. FastAPI 요청 (더 많은 후보를 가져와서 필터링할 수 있도록)
        QueryRequest queryRequest = QueryRequest.builder()
                .words(keywords.getWords())
                .phrases(keywords.getPhrases())
                .topK(Math.max(request.getLimit() * 3, 100))  // 필터링을 위해 더 많이 가져옴
                .build();

        QueryResponse queryResponse = fastApiClient.getRecommendations(queryRequest);

        // 3. 추천 결과를 점수와 함께 Map으로 변환
        Map<String, Double> recommendScores = queryResponse.getResults().stream()
                .collect(Collectors.toMap(
                        Recommendation::getSongId,
                        Recommendation::getScore,
                        (existing, replacement) -> existing
                ));

        // 4. Song 정보 조회
        List<String> songIds = new ArrayList<>(recommendScores.keySet());
        List<Song> songs = songRepository.findAllById(songIds);

        // 5. 학습 조회수 조회 (그룹화하여 count)
        Map<String, Integer> learnCounts = getLearnCountsForSongs(songIds);

        // 6. SongMetaResponse 리스트 생성
        List<SongMetaResponse> songMetas = songs.stream()
                .map(song -> SongMetaResponse.from(
                        song,
                        recommendScores.get(song.getSongId()),
                        learnCounts.getOrDefault(song.getSongId(), 0)
                ))
                .collect(Collectors.toList());

        // 7. 필터링 적용
        if (filter.getDifficulties() != null && !filter.getDifficulties().isEmpty()) {
            List<Song.Level> difficulties = filter.getDifficulties();
            songMetas = songMetas.stream()
                    .filter(song -> difficulties.contains(song.getDifficulty()))
                    .collect(Collectors.toList());
        }




        // 8. 정렬 적용
        songMetas = applySorting(songMetas, filter);

        // 9. 페이징 적용
        int totalElements = songMetas.size();
        int start = filter.getPage() * filter.getSize();
        int end = Math.min(start + filter.getSize(), totalElements);
        List<SongMetaResponse> pagedSongs = songMetas.subList(
                Math.min(start, totalElements),
                Math.min(end, totalElements)
        );

        // 10. 추천 이유 저장 (songId별 대표 문장)
        saveRecommendationReasons(userId, queryResponse);

        // 11. 로그 저장
        saveRecommendationLog(userId, request, pagedSongs, queryResponse);

        // 12. 응답 반환
        return EnhancedRecommendResponse.builder()
                .recommendedSongs(pagedSongs)
                .situation(request.getSituation())
                .location(request.getLocation())
                .keywords(keywords)
                .totalCount(totalElements)
                .build();
    }

    /* 기존 상황 + 장소 기반 추천 (하위 호환성) */
    public RecommendResponse recommendHybrid(Long userId, HybridRecommendRequest request) {
        // 1. LLM에서 keywords + phrases + top_k 생성
        KeywordsResponse keywords = gmsAiClient.generateKeywords(
                request.getSituation(),
                request.getLocation(),
                "gpt-4o"
        );

        // 2. FastAPI 요청
        QueryRequest queryRequest = QueryRequest.builder()
                .words(keywords.getWords())
                .phrases(keywords.getPhrases())
                .topK(request.getLimit() > 0 ? request.getLimit() : 50)  // limit 사용 또는 기본값 50
                .build();

        QueryResponse queryResponse = fastApiClient.getRecommendations(queryRequest);

        // 3. 로그 저장
        RecommendationLog log = RecommendationLog.builder()
                .userId(userId)
                .query(request.getSituation() + " @ " + request.getLocation())
                .candidateSongIds(
                        queryResponse.getResults()
                                .stream()
                                .map(Recommendation::getSongId)
                                .collect(Collectors.toList())
                )
                .algoVersion("hybrid-v1")
                .meta(toJson(queryResponse))
                .build();

        logRepository.save(log);

        // 4. 최종 응답 반환
        return new RecommendResponse(
                queryResponse.getResults()
                        .stream()
                        .map(Recommendation::getSongId)
                        .toList(),
                keywords
        );
    }

    private Map<String, Integer> getLearnCountsForSongs(List<String> songIds) {
        // LearnHistory에서 각 songId의 학습 횟수를 조회
        return learnHistoryRepository.countBySongIdIn(songIds).stream()
                .collect(Collectors.toMap(
                        result -> (String) result[0],  // songId
                        result -> ((Long) result[1]).intValue()  // count
                ));
    }

    private List<SongMetaResponse> applySorting(List<SongMetaResponse> songs, FilterRequest filter) {
        Comparator<SongMetaResponse> comparator = switch (filter.getSortBy()) {
            case RECOMMEND_SCORE -> Comparator.comparing(SongMetaResponse::getRecommendScore,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case POPULARITY -> Comparator.comparing(SongMetaResponse::getPopularity,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case LEARN_COUNT -> Comparator.comparing(SongMetaResponse::getLearnCount,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case DURATION -> Comparator.comparing(SongMetaResponse::getDurationMs,
                    Comparator.nullsLast(Comparator.naturalOrder()));
        };

        if (filter.getSortOrder() == FilterRequest.SortOrder.DESC) {
            comparator = comparator.reversed();
        }

        return songs.stream()
                .sorted(comparator)
                .collect(Collectors.toList());
    }

    /**
     * 노래 ID 리스트를 바탕으로 필터링/정렬 수행
     */
    public EnhancedRecommendResponse filterSongs(List<String> songIds, FilterRequest filter) {
        filter = filter != null ? filter.withDefaults() : new FilterRequest().withDefaults();

        // Song 정보 조회
        List<Song> songs = songRepository.findAllById(songIds);

        // 학습 조회수 조회
        Map<String, Integer> learnCounts = getLearnCountsForSongs(songIds);

        // SongMetaResponse 리스트 생성 (추천 점수는 null로 설정)
        List<SongMetaResponse> songMetas = songs.stream()
                .map(song -> SongMetaResponse.from(
                        song,
                        null,  // 추천 점수 없음
                        learnCounts.getOrDefault(song.getSongId(), 0)
                ))
                .collect(Collectors.toList());

        // 필터링 적용
        if (filter.getDifficulties() != null && !filter.getDifficulties().isEmpty()) {
            List<Song.Level> difficulties = filter.getDifficulties(); // enum 리스트
            songMetas = songMetas.stream()
                    .filter(song -> difficulties.contains(song.getDifficulty()))
                    .collect(Collectors.toList());
        }


        // 정렬 적용
        songMetas = applySorting(songMetas, filter);

        // 페이징 적용
        int totalElements = songMetas.size();
        int start = filter.getPage() * filter.getSize();
        int end = Math.min(start + filter.getSize(), totalElements);
        List<SongMetaResponse> pagedSongs = songMetas.subList(
                Math.min(start, totalElements),
                Math.min(end, totalElements)
        );

        return EnhancedRecommendResponse.builder()
                .recommendedSongs(pagedSongs)
                .keywords(null)  // 필터링만 할 때는 keywords 없음
                .totalCount(totalElements)
                .build();
    }

    private void saveRecommendationLog(Long userId, HybridRecommendRequest request,
                                       List<SongMetaResponse> songs, QueryResponse queryResponse) {
        RecommendationLog log = RecommendationLog.builder()
                .userId(userId)
                .query(request.getSituation() + " @ " + request.getLocation())
                .candidateSongIds(
                        songs.stream()
                                .map(SongMetaResponse::getSongId)
                                .collect(Collectors.toList())
                )
                .algoVersion("hybrid-enhanced-v1")
                .meta(toJson(queryResponse))
                .build();

        logRepository.save(log);
    }

    private void saveRecommendationReasons(Long userId, QueryResponse queryResponse) {
        try {
            // songId별로 점수가 가장 높은 문장을 추천 이유로 저장
            Map<String, Recommendation> songReasonMap = queryResponse.getResults().stream()
                    .collect(Collectors.groupingBy(
                            Recommendation::getSongId,
                            Collectors.maxBy(Comparator.comparing(Recommendation::getScore))
                    ))
                    .entrySet().stream()
                    .filter(entry -> entry.getValue().isPresent())
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            entry -> entry.getValue().get()
                    ));

            for (Map.Entry<String, Recommendation> entry : songReasonMap.entrySet()) {
                String songId = entry.getKey();
                String reasonSentence = entry.getValue().getWords();

                if (reasonSentence != null && !reasonSentence.trim().isEmpty()) {
                    recommendationSentenceService.saveRecommendationReason(userId, songId, reasonSentence);
                }
            }
        } catch (Exception e) {
            log.error("[RecommendService] 추천 이유 저장 실패: {}", e.getMessage());
        }
    }

    public RandomSongResponse recommendRandomSong(Long userId) {
        // 1. 사용자 플레이리스트에서 오디오 특성 계산
        RandomSongRequest.AudioFeatures audioFeatures = calculateUserPlaylistAudioFeatures(userId);

        // 2. 날씨 API에서 현재 날씨 데이터 가져오기
        WeatherClient.WeatherData weatherData = weatherClient.getCurrentWeather("Seoul");

        RandomSongRequest.WeatherData weatherDataDto = RandomSongRequest.WeatherData.builder()
                .condition(weatherData.getCondition())
                .description(weatherData.getDescription())
                .temperature(weatherData.getTemperature())
                .build();

        // 3. FastAPI 요청 구성
        RandomSongRequest fastApiRequest = RandomSongRequest.builder()
                .userId(userId.toString())
                .userPlaylistFeatures(audioFeatures)
                .weatherData(weatherDataDto)
                .minPopularity(80)
                .build();

        // 4. FastAPI 호출
        RandomSongResponse fastApiResponse = fastApiClient.getRandomSongRecommendation(fastApiRequest);

        // 5. Song 정보 조회
        Song song = songRepository.findById(fastApiResponse.getSongId())
                .orElseThrow(() -> new RuntimeException("Song not found"));

        return RandomSongResponse.builder()
                .songId(song.getSongId())
                .title(song.getTitle())
                .artist(song.getArtists())
                .popularity(song.getPopularity())
                .difficulty(song.getLevel() != null ? song.getLevel().name() : null)
                .albumImageUrl(song.getAlbumImgUrl())
                .build();
    }

    private RandomSongRequest.AudioFeatures calculateUserPlaylistAudioFeatures(Long userId) {
        // 사용자 플레이리스트의 모든 곡 ID 가져오기
        List<String> songIds = customPlaylistTrackRepository.findAllSongIdsByUserId(userId);

        if (songIds.isEmpty()) {
            log.info("User {} has no playlist songs. Using default audio features.", userId);
            return RandomSongRequest.AudioFeatures.builder()
                    .acousticness(0.5)
                    .energy(0.5)
                    .loudness(-10.0)
                    .valence(0.5)
                    .tempo(120.0)
                    .build();
        }

        // 곡 정보 조회
        List<Song> songs = songRepository.findAllById(songIds);

        // 오디오 특성 평균 계산
        double avgAcousticness = songs.stream()
                .filter(s -> s.getAcousticness() != null)
                .mapToDouble(Song::getAcousticness)
                .average()
                .orElse(0.5);

        double avgEnergy = songs.stream()
                .filter(s -> s.getEnergy() != null)
                .mapToDouble(Song::getEnergy)
                .average()
                .orElse(0.5);

        double avgLoudness = songs.stream()
                .filter(s -> s.getLoudness() != null)
                .mapToDouble(Song::getLoudness)
                .average()
                .orElse(-10.0);

        double avgValence = songs.stream()
                .filter(s -> s.getValence() != null)
                .mapToDouble(Song::getValence)
                .average()
                .orElse(0.5);

        double avgTempo = songs.stream()
                .filter(s -> s.getTempo() != null)
                .mapToDouble(Song::getTempo)
                .average()
                .orElse(120.0);

        log.info("User {} playlist audio features - Acousticness: {}, Energy: {}, Loudness: {}, Valence: {}, Tempo: {}",
                userId, avgAcousticness, avgEnergy, avgLoudness, avgValence, avgTempo);

        return RandomSongRequest.AudioFeatures.builder()
                .acousticness(avgAcousticness)
                .energy(avgEnergy)
                .loudness(avgLoudness)
                .valence(avgValence)
                .tempo(avgTempo)
                .build();
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 직렬화 실패", e);
        }
    }
}
