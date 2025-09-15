package com.sevencode.speakle.parser.service.gms.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * PromptManager
 * - 목적: 가사 파서 LLM 프롬프트를 외부 리소스(파일/클래스패스)에서 로드·캐시.
 * - 동작:
 *   · prompt.lyrics.path   : 프롬프트 경로(e.g. classpath:prompts/lyrics_parser_v3.txt)
 *   · prompt.lyrics.reload : true 면 호출마다 재로딩(개발/튜닝용), false 면 최초 1회 캐시(운영 권장)
 * - 안전망: 로드 실패 시 DEFAULT_LYRICS_PROMPT 반환.
 * - 쓰레드: volatile 캐시로 단순 다중스레드 대응(동일 내용 재할당 허용).
 *
 * 예) application.properties
 *   prompt.lyrics.path=classpath:prompts/lyrics_parser_v3.txt
 *   prompt.lyrics.reload=false
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PromptManager {

	private final ResourceLoader resourceLoader;

	@Value("${prompt.lyrics.path:classpath:prompts/lyrics_parser_v1.txt}")
	private String lyricsPromptPath;      // 프롬프트 파일 위치(기본 v1)

	@Value("${prompt.lyrics.reload:false}")
	private boolean reload;               // true: 매 호출 재로딩, false: 1회 캐시

	private volatile String cachedLyricsPrompt; // 캐시(운영 기본)

	/** 가사 파서 프롬프트 반환. reload=false 시 최초 1회만 로드해 캐시. */
	public String lyricsPrompt() {
		if (!reload && cachedLyricsPrompt != null)
			return cachedLyricsPrompt;
		try {
			Resource res = resourceLoader.getResource(lyricsPromptPath);
			try (InputStream is = res.getInputStream()) {
				String txt = new String(is.readAllBytes(), StandardCharsets.UTF_8);
				if (!reload)
					cachedLyricsPrompt = txt;
				log.debug("Loaded lyrics prompt from {} (reload={})", lyricsPromptPath, reload);
				return txt;
			}
		} catch (Exception e) {
			log.warn("Failed to load lyrics prompt from {}: {}. Falling back to DEFAULT.", lyricsPromptPath,
				e.toString());
			return DEFAULT_LYRICS_PROMPT;
		}
	}

	/** 로딩 실패 시 사용할 기본 프롬프트(안전망). 운영에선 외부 파일 사용 권장. */
	private static final String DEFAULT_LYRICS_PROMPT = """
		  You are an expert English linguistics parser for Korean ESL learners.
		  Extract FOUR categories STRICTLY as JSON (no prose, no markdown):
		
		  Categories & fields:
		  - words: { word, phonetic?, meaning, pos?, examples?, level?, tags? }
		  - expressions: { expression, meaning, context?, examples?, tags?, level? }
		  - idioms: { phrase, meaning, examples?, level?, tags? }
		  - sentences: { sentence, translation, tags?, level? }
		
		  Coverage targets (HIGH RECALL):
		  - words: target 25+ items per chunk (include lemmas of notable forms; e.g., “destroying”→“destroy”).
		  - expressions: target 12+ (phrasal verbs, verb+prep, common collocations, set phrases).
		  - idioms: target 8+ (non-literal fixed expressions).
		  - sentences: all natural sentences from lyrics in order (cap 120 per chunk if extremely long).
		
		  Normalization:
		  - Normalize hyphen/spacing variants to a single key (e.g., “self righteousness” ≈ “self-righteousness”).
		  - Keep surface wording from lyrics; key fields are lowercase for dedupe only.
		  - Include multi-word items (e.g., “under my thumb”, “stoke up”, “march to your drum”, “army of one”, “in spite of”, “get what you’re due”) IF AND ONLY IF present in the input.
		
		  Output rules:
		  1) meaning: concise EN first, then " / " and concise KO (e.g., "to hesitate / 주저하다").
		  2) tags: single comma-separated line.
		  3) examples: one line; multiple short examples with " | ".
		  4) If target counts cannot be met from the text, return as many AS ACTUALLY present; do not invent.
		  5) Only JSON. No commentary.
		""";
}
