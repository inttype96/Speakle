//package com.sevencode.speakle.song.service;
//
//import com.opencsv.CSVReader;
//import com.opencsv.CSVReaderBuilder;
//import com.opencsv.CSVParserBuilder;
//import com.opencsv.exceptions.CsvValidationException;
//import com.sevencode.speakle.song.domain.LyricChunk;
//import com.sevencode.speakle.song.domain.Song;
//import com.sevencode.speakle.song.repository.LyricChunkRepository;
//import com.sevencode.speakle.song.repository.SongRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.io.FileReader;
//import java.io.IOException;
//import java.time.LocalDateTime;
//import java.util.*;
//
//@Slf4j
//@Service
//@RequiredArgsConstructor
//public class CsvImportService {
//
//    private final SongRepository songRepository;
//    private final LyricChunkRepository lyricChunkRepository;
//
//    private static final String META_CSV_PATH = "C:\\ssafy\\S13P21C104\\data-service\\data\\clean_meta_en_with_popularity_with_adult_pop50.csv";
//    private static final String LYRICS_CSV_PATH = "C:\\ssafy\\S13P21C104\\data-service\\data\\songs_with_lyrics_and_timestamps_clean.csv";
//    private static final int BATCH_SIZE = 500;
//
//    @Transactional
//    public Map<String, Object> importAllData() {
//        Map<String, Object> result = new HashMap<>();
//
//        // 1. 먼저 Song 데이터 적재
//        Map<String, Object> songResult = importSongs();
//        result.put("songs", songResult);
//
//        // 2. 그 다음 Lyrics 데이터 적재
//        Map<String, Object> lyricsResult = importLyrics();
//        result.put("lyrics", lyricsResult);
//
//        return result;
//    }
//
//    @Transactional
//    public Map<String, Object> importSongs() {
//        log.info("=== STARTING SONG IMPORT ===");
//        Map<String, Object> result = new HashMap<>();
//        int total = 0;
//        int success = 0;
//        int failed = 0;
//
//        try (CSVReader reader = new CSVReaderBuilder(new FileReader(META_CSV_PATH))
//                .withSkipLines(1)
//                .withCSVParser(new CSVParserBuilder()
//                        .withSeparator(',')
//                        .withQuoteChar('"')
//                        .withEscapeChar('\\')
//                        .withStrictQuotes(false)
//                        .withIgnoreLeadingWhiteSpace(true)
//                        .withIgnoreQuotations(false)
//                        .build())
//                .build()) {
//
//            List<Song> batch = new ArrayList<>();
//            String[] line;
//
//            while (true) {
//                try {
//                    line = reader.readNext();
//                    if (line == null) break;
//                } catch (CsvValidationException e) {
//                    log.warn("CSV validation error at row {}: {}", total + 1, e.getMessage());
//                    total++;
//                    failed++;
//                    continue;
//                }
//                total++;
//
//                if (total % 1000 == 0) {
//                    log.info("Processing song row: {}", total);
//                }
//
//                try {
//                    // 배열 길이 체크
//                    if (line.length < 24) {
//                        log.warn("Row {} has {} columns, expected 24", total, line.length);
//                        failed++;
//                        continue;
//                    }
//
//                    Song song = Song.builder()
//                            .songId(line[0].trim())
//                            .title(line[1])
//                            .album(line[2])
//                            .artists(line[3])
//                            .danceability(safeParseDouble(line[4]))
//                            .energy(safeParseDouble(line[5]))
//                            .key(safeParseShort(line[6]))
//                            .loudness(safeParseDouble(line[7]))
//                            .mode(safeParseShort(line[8]))
//                            .speechiness(safeParseDouble(line[9]))
//                            .acousticness(safeParseDouble(line[10]))
//                            .instrumentalness(safeParseDouble(line[11]))
//                            .liveness(safeParseDouble(line[12]))
//                            .valence(safeParseDouble(line[13]))
//                            .tempo(safeParseDouble(line[14]))
//                            .durationMs(safeParseLong(line[15]))
//                            .lyrics(line[16])
//                            .level(safeParseLevel(line[19]))
//                            .albumImgUrl(line[20])
//                            .popularity(safeParseInteger(line[21]))
//                            .isAdult(safeParseBoolean(line[23]))
//                            .createdAt(LocalDateTime.now())
//                            .build();
//
//                    batch.add(song);
//                    success++;
//
//                    if (batch.size() >= BATCH_SIZE) {
//                        songRepository.saveAll(batch);
//                        log.info("Saved {} songs (total: {})", batch.size(), success);
//                        batch.clear();
//                    }
//
//                } catch (Exception e) {
//                    log.error("Failed to parse row {}: {}", total, e.getMessage());
//                    failed++;
//                }
//            }
//
//            // 남은 데이터 저장
//            if (!batch.isEmpty()) {
//                songRepository.saveAll(batch);
//                log.info("Saved final batch of {} songs", batch.size());
//            }
//
//        } catch (IOException e) {
//            log.error("Failed to read CSV", e);
//            result.put("error", e.getMessage());
//            return result;
//        } catch (Exception e) {
//            log.error("Unexpected error during song import", e);
//            result.put("error", e.getMessage());
//            return result;
//        }
//
//        result.put("total", total);
//        result.put("success", success);
//        result.put("failed", failed);
//        log.info("=== SONG IMPORT COMPLETE: {}/{} success ===", success, total);
//
//        return result;
//    }
//
//    @Transactional
//    public Map<String, Object> importLyrics() {
//        log.info("=== STARTING LYRICS IMPORT ===");
//        Map<String, Object> result = new HashMap<>();
//        int total = 0;
//        int success = 0;
//        int failed = 0;
//        int skipped = 0;
//
//        // Song 캐시 생성
//        Map<String, Song> songCache = new HashMap<>();
//        songRepository.findAll().forEach(song ->
//            songCache.put(song.getSongId(), song)
//        );
//        log.info("Loaded {} songs into cache", songCache.size());
//
//        try (CSVReader reader = new CSVReaderBuilder(new FileReader(LYRICS_CSV_PATH))
//                .withSkipLines(1)
//                .withCSVParser(new CSVParserBuilder()
//                        .withSeparator(',')
//                        .withQuoteChar('"')
//                        .withEscapeChar('\\')
//                        .withStrictQuotes(false)
//                        .withIgnoreLeadingWhiteSpace(true)
//                        .withIgnoreQuotations(false)
//                        .build())
//                .build()) {
//
//            List<LyricChunk> batch = new ArrayList<>();
//            String[] line;
//            Set<String> processedIds = new HashSet<>();
//
//            while (true) {
//                try {
//                    line = reader.readNext();
//                    if (line == null) break;
//                } catch (CsvValidationException e) {
//                    log.warn("CSV validation error at lyrics row {}: {}", total + 1, e.getMessage());
//                    total++;
//                    failed++;
//                    continue;
//                }
//                total++;
//
//                if (total % 10000 == 0) {
//                    log.info("Processing lyrics row: {}", total);
//                }
//
//                try {
//                    // 배열 길이 체크
//                    if (line.length < 4) {
//                        log.warn("Row {} has {} columns, expected 4", total, line.length);
//                        failed++;
//                        continue;
//                    }
//
//                    String songId = line[0].trim();
//                    Song song = songCache.get(songId);
//
//                    if (song == null) {
//                        skipped++;
//                        continue;
//                    }
//
//                    String chunkId = songId + "_" + line[3].trim();
//
//                    // 중복 체크
//                    if (processedIds.contains(chunkId)) {
//                        skipped++;
//                        continue;
//                    }
//                    processedIds.add(chunkId);
//
//                    LyricChunk chunk = LyricChunk.builder()
//                            .songsLyricsId(chunkId)
//                            .song(song)
//                            .startTimeMs(safeParseLong(line[1]))
//                            .english(line[2])
//                            .korean(null)
//                            .build();
//
//                    batch.add(chunk);
//                    success++;
//
//                    if (batch.size() >= BATCH_SIZE) {
//                        lyricChunkRepository.saveAll(batch);
//                        log.info("Saved {} lyrics (total: {})", batch.size(), success);
//                        batch.clear();
//                    }
//
//                } catch (Exception e) {
//                    log.error("Failed to parse row {}: {}", total, e.getMessage());
//                    failed++;
//                }
//            }
//
//            // 남은 데이터 저장
//            if (!batch.isEmpty()) {
//                lyricChunkRepository.saveAll(batch);
//                log.info("Saved final batch of {} lyrics", batch.size());
//            }
//
//        } catch (IOException e) {
//            log.error("Failed to read CSV", e);
//            result.put("error", e.getMessage());
//            return result;
//        } catch (Exception e) {
//            log.error("Unexpected error during lyrics import", e);
//            result.put("error", e.getMessage());
//            return result;
//        }
//
//        result.put("total", total);
//        result.put("success", success);
//        result.put("failed", failed);
//        result.put("skipped", skipped);
//        log.info("=== LYRICS IMPORT COMPLETE: {}/{} success, {} skipped ===", success, total, skipped);
//
//        return result;
//    }
//
//    @Transactional
//    public void clearAll() {
//        log.warn("CLEARING ALL DATA");
//        lyricChunkRepository.deleteAll();
//        songRepository.deleteAll();
//        log.info("ALL DATA CLEARED");
//    }
//
//    // 안전한 파싱 메서드들
//    private Double safeParseDouble(String value) {
//        if (value == null || value.trim().isEmpty() || "null".equalsIgnoreCase(value.trim())) {
//            return null;
//        }
//        try {
//            return Double.parseDouble(value.trim());
//        } catch (Exception e) {
//            return null;
//        }
//    }
//
//    private Long safeParseLong(String value) {
//        if (value == null || value.trim().isEmpty() || "null".equalsIgnoreCase(value.trim())) {
//            return null;
//        }
//        try {
//            // 소수점이 있으면 제거
//            if (value.contains(".")) {
//                value = value.substring(0, value.indexOf("."));
//            }
//            return Long.parseLong(value.trim());
//        } catch (Exception e) {
//            return null;
//        }
//    }
//
//    private Integer safeParseInteger(String value) {
//        if (value == null || value.trim().isEmpty() || "null".equalsIgnoreCase(value.trim())) {
//            return null;
//        }
//        try {
//            // 소수점이 있으면 제거
//            if (value.contains(".")) {
//                value = value.substring(0, value.indexOf("."));
//            }
//            return Integer.parseInt(value.trim());
//        } catch (Exception e) {
//            return null;
//        }
//    }
//
//    private Short safeParseShort(String value) {
//        if (value == null || value.trim().isEmpty() || "null".equalsIgnoreCase(value.trim())) {
//            return null;
//        }
//        try {
//            // 소수점이 있으면 제거
//            if (value.contains(".")) {
//                value = value.substring(0, value.indexOf("."));
//            }
//            return Short.parseShort(value.trim());
//        } catch (Exception e) {
//            return null;
//        }
//    }
//
//    private Boolean safeParseBoolean(String value) {
//        if (value == null || value.trim().isEmpty()) {
//            return false;
//        }
//        value = value.trim();
//        return "1".equals(value) || "true".equalsIgnoreCase(value) || "True".equals(value);
//    }
//
//    private Song.Level safeParseLevel(String value) {
//        if (value == null || value.trim().isEmpty()) {
//            return Song.Level.MEDIUM;
//        }
//        try {
//            return Song.Level.valueOf(value.trim().toUpperCase());
//        } catch (Exception e) {
//            log.debug("Unknown level: {}, using MEDIUM", value);
//            return Song.Level.MEDIUM;
//        }
//    }
//}