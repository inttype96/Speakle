package com.sevencode.speakle.parser.controller;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sevencode.speakle.parser.service.LyricChunkParsingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/lyrics/chunks")
@RequiredArgsConstructor
public class ParsingTestController {

    private final LyricChunkParsingService lyricChunkParsingService;

    /**
     * 곡 식별자로 번역 파싱 실행 & 결과 응답
     * 예: POST /api/lyrics/chunks/parse/{songId}
     */
    @PostMapping("/parse/{songId}")
    public Mono<ResponseEntity<ObjectNode>> parseBySongId(@PathVariable String songId) {
        return lyricChunkParsingService.cunkSaveBySongId(songId)
                .map(ResponseEntity::ok);
    }
}
