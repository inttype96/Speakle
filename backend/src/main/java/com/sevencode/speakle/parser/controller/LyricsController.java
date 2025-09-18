package com.sevencode.speakle.parser.controller;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sevencode.speakle.parser.service.LyricsParsingService;
import com.sevencode.speakle.parser.service.LyricsPreprocessor;

import lombok.RequiredArgsConstructor;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * LyricsController
 *
 * 팀 공용 예시 컨트롤러(테스트 겸 레퍼런스).
 *
 * ▶ 제공 엔드포인트
 *  1) POST /api/lyrics/parse
 *     - 본문(JSON): {"lyrics":"...가사 원문..."}
 *     - 응답(JSON): 파싱 결과(4개 배열: words/expressions/idioms/sentences)
 *     - 저장하지 않음(Stateless).
 *
 *  2) POST /api/lyrics/parse-and-save
 *     - 쿼리/본문로 learnedSongId 전달 + 본문에 lyrics
 *       · 예: ?learnedSongId=123 또는 {"learnedSongId":"123","lyrics":"..."}
 *     - DB에 없으면 파싱→저장, 이미 있으면 LLM 스킵 후 저장된 내용 반환.
 *
 *  3) POST /api/lyrics/process
 *     - 본문(JSON): {"lyrics":"...가사 원문..."}
 *     - 응답(JSON): {chunks: N, data: ["청크1", "청크2", ...]}
 *     - 전처리/청크 확인용(LLM 호출 없음).
 *
 * ▶ 사용 예(cURL)
 *  - Parse:
 *    curl -X POST http://localhost:8080/api/lyrics/parse \
 *         -H "Content-Type: application/json" \
 *         -d '{"lyrics":"You like to stand on the other side ..."}'
 *
 *  - Parse & Save:
 *    curl -X POST "http://localhost:8080/api/lyrics/parse-and-save?learnedSongId=123" \
 *         -H "Content-Type: application/json" \
 *         -d '{"lyrics":"..."}'
 *
 * ▶ 운영 팁
 *  - 응답이 비JSON이면 서비스 레이어에서 empty slice로 방어됨.
 *  - 대용량은 MVC/GMS 타임아웃을 프로퍼티로 조정(레퍼런스 application.properties 참조).
 *  - 로그 레벨은 개발 시 DEBUG/TRACE, 운영 시 INFO 권장.
 */
@RestController
@RequestMapping("/api/lyrics")
@RequiredArgsConstructor
@Slf4j
@Validated
public class LyricsController {

	private final LyricsPreprocessor preprocessor;          // 전처리/분할 유틸
	private final LyricsParsingService parsingService;      // Stateless 파싱용
	private final LyricsParsingService lyricsParsingService; // 저장 포함 플로우

	/**
	 * (예시) LLM 파싱만 수행 — 저장하지 않음.
	 * Request: {"lyrics":"..."}
	 * Response: ObjectNode {words[], expressions[], idioms[], sentences[]}
	 */
	@PostMapping("/parse")
	public Mono<ResponseEntity<ObjectNode>> parse(@RequestBody @Validated ProcessRequest req) {
		return parsingService.parse(req.getLyrics())
			.map(ResponseEntity::ok);
	}

	/**
	 * (예시) 파싱 후 DB 저장(이미 있으면 스킵하고 DB내용 반환).
	 * QueryParam 또는 Body로 learnedSongId 허용.
	 * Body 예: {"learnedSongId":"123","lyrics":"..."}
	 */
	@PostMapping("/parse-and-save")
	public Mono<ResponseEntity<ObjectNode>> parseAndSave(
		@RequestParam(value = "learnedSongId", required = false) String learnedSongId,
		@RequestBody Map<String, String> body) {

		// Body에만 들어온 경우 보정
		if (learnedSongId == null) {
			String idStr = body.get("learnedSongId");
			learnedSongId = (idStr != null && !idStr.isBlank()) ? idStr : null;
		}
		String lyrics = body.get("lyrics");

		// 필수값 검증
		if (learnedSongId == null || lyrics == null || lyrics.isBlank()) {
			return Mono.just(ResponseEntity.badRequest().build());
		}

		return lyricsParsingService.parseAndSave(learnedSongId, lyrics)
			.map(ResponseEntity::ok);
	}

	/**
	 * (예시) 전처리/분할만 확인(LLM 호출 없음).
	 * Request: {"lyrics":"..."}
	 * Response: {chunks:N, data:[...]}
	 */
	@PostMapping("/process")
	public ResponseEntity<ProcessResponse> process(@RequestBody @Validated ProcessRequest req) {
		// 1) 전처리 + 분할
		List<String> chunks = preprocessor.preprocess(req.lyrics);

		// 2) 간단 로그(행/문자/프리뷰) — 운영 시 레벨 조정 권장
		log.info("lyrics processed: chunks={}", chunks.size());
		for (int i = 0; i < chunks.size(); i++) {
			String c = chunks.get(i);
			int lines = c.isEmpty() ? 0 : (int)c.chars().filter(ch -> ch == '\n').count() + 1;
			String preview = c.length() > 120 ? c.substring(0, 120) + "…" : c;
			log.info("chunk {} -> lines={}, chars={}, preview={}", i + 1, lines, c.length(),
				preview.replace("\n", "\\n"));
		}

		// 3) 응답
		return ResponseEntity.ok(new ProcessResponse(chunks.size(), chunks));
	}

	// === DTOs ===

	/** 요청 DTO(간단형). 팀에서 확장 시 필드 추가 가능. */
	public static class ProcessRequest {
		private String lyrics;

		public ProcessRequest() {
		}

		public String getLyrics() {
			return lyrics;
		}

		public void setLyrics(String lyrics) {
			this.lyrics = lyrics;
		}
	}

	/** 응답 DTO(프로토타입). 필요 시 메타데이터/통계 필드 추가 가능. */
	public static class ProcessResponse {
		private int chunks;
		private List<String> data;

		public ProcessResponse(int chunks, List<String> data) {
			this.chunks = chunks;
			this.data = data;
		}

		public int getChunks() {
			return chunks;
		}

		public List<String> getData() {
			return data;
		}
	}
}
