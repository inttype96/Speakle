package com.sevencode.speakle.parser.controller;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sevencode.speakle.common.dto.ResponseWrapper;
import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.parser.service.LyricsParsingService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import reactor.core.publisher.Mono;

@Tag(name = "Parsing", description = "가사 파싱/저장 엔드포인트")
@RestController
@RequestMapping("/api/parsing")
@RequiredArgsConstructor
@Slf4j
@Validated
public class ParsingController {

	private final LyricsParsingService lyricsParsingService;

	/**
	 * 가사 파싱 & 저장 (songId만 입력)
	 * - 이미 파싱 데이터가 있으면 LLM 스킵, DB 값 재조립 후 반환
	 * - 없으면 가사 조회→파싱→저장→DB 재조립 후 반환
	 */
	@Operation(
		summary = "가사 파싱 및 저장",
		description = "songId로 가사를 조회해 파싱하고 DB에 저장합니다. 이미 저장된 경우 저장된 값을 반환합니다.",
		security = @SecurityRequirement(name = "bearerAuth"),
		responses = {
			@ApiResponse(responseCode = "200", description = "성공", content = @Content(
				mediaType = "application/json",
				examples = @ExampleObject(value = """
					{
					  "status": 200,
					  "message": "가사 파싱이 완료되었습니다.",
					  "data": {
					    "words": [],
					    "expressions": [],
					    "idioms": [],
					    "sentences": []
					  }
					}
					""")
			)),
			@ApiResponse(responseCode = "400", description = "요청 값 오류", content = @Content(
				mediaType = "application/json",
				examples = @ExampleObject(value = """
					{ "status": 400, "message": "songId 값이 비어 있습니다.", "data": null }
					""")
			)),
			@ApiResponse(responseCode = "404", description = "가사 없음", content = @Content(
				mediaType = "application/json",
				examples = @ExampleObject(value = """
					{ "status": 404, "message": "해당 songId에 대한 가사가 존재하지 않습니다.", "data": null }
					""")
			))
		}
	)
	@PostMapping("/{songId}")
	public Mono<ResponseEntity<ResponseWrapper<ObjectNode>>> parseAndSave(
		@AuthenticationPrincipal UserPrincipal me,
		@PathVariable String songId,
		@RequestBody(required = false) Map<String, String> body) {

		// Extract situation and location from body
		String situation = (body != null) ? body.get("situation") : null;
		String location = (body != null) ? body.get("location") : null;

		// 검증
		if (songId == null || songId.isBlank()) {
			return Mono.just(ResponseEntity.badRequest()
				.body(ResponseWrapper.fail(400, "songId 값이 비어 있습니다.")));
		}

		log.info("parse request by userId={}, songId={}, situation={}, location={}",
			(me != null ? me.userId() : null), songId, situation, location);

		// 실제 서비스 호출 - context-aware parsing
		return lyricsParsingService.parseAndSaveBySongIdWithContext(songId, situation, location)
			.map(result -> ResponseEntity.ok(
				ResponseWrapper.success(200, "가사 파싱이 완료되었습니다.", result)))
			.onErrorResume(ex -> {
				String msg = ex.getMessage() != null ? ex.getMessage() : "가사 파싱 중 오류가 발생했습니다.";
				if (msg.contains("존재하지 않습니다") || msg.contains("찾을 수 없습니다")) {
					return Mono.just(ResponseEntity.status(404)
						.body(ResponseWrapper.fail(404, msg)));
				}
				if (msg.contains("비어 있습니다") || msg.contains("유효하지")) {
					return Mono.just(ResponseEntity.badRequest()
						.body(ResponseWrapper.fail(400, msg)));
				}
				log.error("가사 파싱 실패: userId={}, songId={}, situation={}, location={}, error={}",
					(me != null ? me.userId() : null), songId, situation, location, msg, ex);
				return Mono.just(ResponseEntity.status(500)
					.body(ResponseWrapper.fail(500, "가사 파싱 중 오류가 발생했습니다.")));
			});
	}

	@PostMapping
	public Mono<ResponseEntity<ResponseWrapper<ObjectNode>>> parseAndSaveLegacy(
		@AuthenticationPrincipal UserPrincipal me,
		@RequestParam(value = "songId", required = false) String songIdQuery,
		@RequestBody(required = false) Map<String, String> body) {

		// 1) body와 queryParam 모두 허용 (body 우선)
		String songIdBody = (body != null) ? body.get("songId") : null;
		String songId = (songIdBody != null && !songIdBody.isBlank())
			? songIdBody
			: songIdQuery;

		// 2) 검증
		if (songId == null || songId.isBlank()) {
			return Mono.just(ResponseEntity.badRequest()
				.body(ResponseWrapper.fail(400, "songId 값이 비어 있습니다.")));
		}

		log.info("parse request (legacy) by userId={}, songId={}",
			(me != null ? me.userId() : null), songId);

		// 3) 실제 서비스 호출 - backward compatibility
		return lyricsParsingService.parseAndSaveBySongId(songId)
			.map(result -> ResponseEntity.ok(
				ResponseWrapper.success(200, "가사 파싱이 완료되었습니다.", result)))
			.onErrorResume(ex -> {
				String msg = ex.getMessage() != null ? ex.getMessage() : "가사 파싱 중 오류가 발생했습니다.";
				if (msg.contains("존재하지 않습니다") || msg.contains("찾을 수 없습니다")) {
					return Mono.just(ResponseEntity.status(404)
						.body(ResponseWrapper.fail(404, msg)));
				}
				if (msg.contains("비어 있습니다") || msg.contains("유효하지")) {
					return Mono.just(ResponseEntity.badRequest()
						.body(ResponseWrapper.fail(400, msg)));
				}
				log.error("가사 파싱 실패: userId={}, songId={}, error={}",
					(me != null ? me.userId() : null), songId, msg, ex);
				return Mono.just(ResponseEntity.status(500)
					.body(ResponseWrapper.fail(500, "가사 파싱 중 오류가 발생했습니다.")));
			});
	}
}
