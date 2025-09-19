package com.sevencode.speakle.parser.service;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sevencode.speakle.parser.repository.CopyLyricChunkRepository;
import com.sevencode.speakle.song.domain.LyricChunk;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LyricChunkParsingService {

    private final CopyLyricChunkRepository copyLyricChunkRepository;
    private final LyricsParsingService lyricsParsingService; // 번역 전용 호출 포함
    private final ObjectMapper objectMapper;

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }

    /**
     * 곡 식별자로 청크를 불러와 한국어가 비어있는 라인만 모아 번역/저장하고,
     * 곡 단위 응답(lyricChunks 배열) 반환
     */
    public Mono<ObjectNode> cunkSaveBySongId(String songId) {
        if (songId == null || songId.isBlank()) {
            return Mono.error(new IllegalArgumentException("songId 값이 비어 있습니다."));
        }

        // 0) 곡 전체 청크 로딩 (+ 정렬 안전망)
        return Mono.fromCallable(() ->
                        copyLyricChunkRepository.findAllBySong_SongIdOrderByStartTimeMsAsc(songId))
                .subscribeOn(Schedulers.boundedElastic())
                .map(list -> {
                    if (list == null || list.isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "해당 songId에 대한 LyricChunk가 존재하지 않습니다.");
                    }
                    // 서비스단 정렬 보장 (startTimeMs ASC, null 우선)
                    list.sort(Comparator.comparing(LyricChunk::getStartTimeMs,
                            Comparator.nullsFirst(Long::compareTo)));
                    return list;
                })
                .flatMap(chunks -> {
                    // 1) 대상 선별: korean 비고 + english 유
                    List<LyricChunk> targets = chunks.stream()
                            .filter(c -> isBlank(c.getKorean()) && !isBlank(c.getEnglish()))
                            .collect(Collectors.toList());

                    log.info("songId={} 번역 대상 {}건", songId, targets.size());

                    if (targets.isEmpty()) {
                        // 저장 없이 곡 단위 응답만 반환
                        return Mono.just(buildLyricChunksResponse(chunks));
                    }

                    // 2) 영어 라인만 뽑아서 번역 전용 호출
                    List<String> englishLines = targets.stream()
                            .map(LyricChunk::getEnglish)
                            .collect(Collectors.toList());

                    return lyricsParsingService.translateOnlyLines(englishLines)
                            .timeout(java.time.Duration.ofSeconds(30))
                            .onErrorResume(ex -> {
                                log.error("translateOnlyLines failed: {}", ex.getMessage(), ex);
                                // 실패 시 저장 없이 현재 상태로 응답만 반환
                                return Mono.just(java.util.Collections.nCopies(englishLines.size(), ""));
                            })
                            .flatMap(koLines -> {
                                int n = Math.min(koLines.size(), targets.size());
                                int count = 0;
                                for (int i = 0; i < n; i++) {
                                    String ko = koLines.get(i);
                                    if (!isBlank(ko)) {
                                        targets.get(i).setKorean(ko);
                                        count++;
                                    }
                                }

                                if (count == 0) {
                                    log.warn("No lines translated. Skip save.");
                                    return Mono.just(buildLyricChunksResponse(chunks));
                                }

                                final int updatedCount = count; // effectively final
                                return Mono.fromCallable(() -> {
                                            copyLyricChunkRepository.saveAll(targets);
                                            return updatedCount;
                                        })
                                        .subscribeOn(Schedulers.boundedElastic())
                                        .thenReturn(buildLyricChunksResponse(chunks));
                            });
                });
    }

    // ---------- Helpers ----------

    /** 응답 스펙: { "lyricChunks": [ {id, startTimeMs, english, korean}, ... ] } */
    private ObjectNode buildLyricChunksResponse(List<LyricChunk> chunks) {
        ObjectNode resp = objectMapper.createObjectNode();
        ArrayNode arr = objectMapper.createArrayNode();

        for (LyricChunk c : chunks) {
            ObjectNode node = objectMapper.createObjectNode();
            node.put("id", c.getSongsLyricsId()); // String 필드라면 그대로
            if (c.getStartTimeMs() != null) {
                node.put("startTimeMs", c.getStartTimeMs());
            } else {
                node.putNull("startTimeMs");
            }
            node.put("english", c.getEnglish() != null ? c.getEnglish() : "");
            if (!isBlank(c.getKorean())) {
                node.put("korean", c.getKorean());
            } else {
                node.putNull("korean");
            }
            arr.add(node);
        }

        resp.set("lyricChunks", arr);
        return resp;
    }

}
