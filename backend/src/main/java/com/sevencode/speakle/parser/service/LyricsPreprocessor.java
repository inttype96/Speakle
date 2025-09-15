package com.sevencode.speakle.parser.service;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;

/**
 * LyricsPreprocessor
 * - 가사 텍스트를 간결히 정규화하고(문자/따옴표/대시 등), 길이/행수 기준으로 청크 분할.
 * - 작은 입력은 원문 1청크로, 큰 입력만 스탠자 우선으로 쪼갠다.
 */
@Service
@Slf4j
public class LyricsPreprocessor {

	// 분할 트리거/상한(필요 시 조정 포인트)
	private static final int TRIGGER_MAX_LINES = 45;   // 이하면 분할 생략
	private static final int TRIGGER_MIN_TOKENS = 600; // 이하면 분할 생략(대략 글자수/4)
	private static final int TARGET_MAX_LINES = 60;    // 청크 목표 행수 상한
	private static final int HARD_MAX_CHARS = 3600;    // 청크 하드 문자 상한

	// 유니코드 정규화 패턴(따옴표/대시 → ASCII)
	private static final Pattern UNICODE_DASHES = Pattern.compile("[\\-‐-‒–—―]");
	private static final Pattern LQUOTE = Pattern.compile("[\u2018\u2019\u02BC]");
	private static final Pattern DQUOTE = Pattern.compile("[\u201C\u201D]");

	public List<String> preprocess(String rawLyrics) {
		String cleaned = clean(rawLyrics);
		if (cleaned == null)
			return Collections.emptyList();

		int lines = countLines(cleaned);
		int estTokens = estimateTokens(cleaned);

		log.debug("lyrics stats: lines={}, chars={}, estTokens~{}", lines, cleaned.length(), estTokens);
		log.info("[변환] :  " + cleaned);

		// 작은 입력은 그대로 1청크
		if (lines < TRIGGER_MAX_LINES && estTokens < TRIGGER_MIN_TOKENS) {
			return List.of(cleaned);
		}
		// 큰 입력은 분할
		return splitLyrics(cleaned);
	}

	// ===== Clean =====
	private static String clean(String lyrics) {
		if (lyrics == null)
			return null;

		// 개행/공백/정규화
		lyrics = lyrics.replaceAll("\\r\\n?", "\n");
		lyrics = lyrics.replace('\u00A0', ' ');
		lyrics = Normalizer.normalize(lyrics, Normalizer.Form.NFC);

		// 스마트 따옴표/대시 정규화
		lyrics = LQUOTE.matcher(lyrics).replaceAll("'");
		lyrics = DQUOTE.matcher(lyrics).replaceAll("\"");
		lyrics = UNICODE_DASHES.matcher(lyrics).replaceAll("-");

		// 하이픈 주변 공백/의미 처리(단어-단어 등)
		lyrics = lyrics.replaceAll("\\s*-(?=\\s*\\S)", "-");
		lyrics = lyrics.replaceAll("-(?=\\s)", "-");
		lyrics = lyrics.replaceAll("(?<=\\p{L})-(?=\\p{L})", " ");
		lyrics = lyrics.replaceAll("(?<=\\p{L})-(?=\\d)", "");
		lyrics = lyrics.replaceAll("(?<=\\d)-(?=\\p{L})", "");
		lyrics = lyrics.replaceAll("(?<=\\d)-(?=\\d)", " ");

		// 장식 문자 제거/개행 정리
		lyrics = lyrics.replaceAll("[♪♫★☆※•◦◆◇▶▷]", "");
		lyrics = lyrics.replaceAll("\\n{2,}", "\n");

		// 허용 문자만 유지(라틴/숫자/일부 문장부호)
		lyrics = lyrics.replaceAll("[^\\p{IsLatin}\\p{M}\\p{N}\\s\\.,'?!():;]", "");

		// 여백 정리
		lyrics = lyrics.replaceAll("[ \\t\\x0B\\f\\r]+", " ");
		lyrics = lyrics.replaceAll("[ ]*\\n[ ]*", "\n").trim();

		if (lyrics.length() <= 10)
			return null;
		return lyrics;
	}

	// ===== Split (스탠자 우선, 목표 행/문자 초과 시 롤오버) =====
	private static List<String> splitLyrics(String lyrics) {
		List<String> stanzas = splitByBlankLines(lyrics);

		List<String> chunks = new ArrayList<>();
		StringBuilder cur = new StringBuilder();

		for (String stanza : stanzas) {
			int stanzaLines = countLines(stanza);
			int stanzaChars = stanza.length();

			// 과대 스탠자는 즉시 행수 기준 분할
			if (stanzaLines > TARGET_MAX_LINES || stanzaChars > HARD_MAX_CHARS) {
				for (String hard : splitByLineCount(stanza, TARGET_MAX_LINES)) {
					addWithRollOver(chunks, hard, cur);
				}
				continue;
			}

			// 현재 청크에 더하면 초과 시 롤오버
			if (wouldExceed(cur, stanza, TARGET_MAX_LINES, HARD_MAX_CHARS)) {
				rollOver(chunks, cur);
			}
			appendWithSep(cur, stanza);
		}

		flush(chunks, cur);
		return enforceHardMax(chunks); // 마지막 안전 점검
	}

	// ===== Utils =====
	private static int countLines(String s) {
		if (s.isEmpty())
			return 0;
		int n = 1;
		for (int i = 0; i < s.length(); i++)
			if (s.charAt(i) == '\n')
				n++;
		return n;
	}

	private static int estimateTokens(String s) {
		return Math.max(1, s.length() / 4); // 대략 추정
	}

	private static List<String> splitByBlankLines(String s) {
		String[] parts = s.split("\\n{2,}");
		List<String> out = new ArrayList<>(parts.length);
		for (String p : parts) {
			String t = p.strip();
			if (!t.isEmpty())
				out.add(t);
		}
		return out.isEmpty() ? List.of(s) : out;
	}

	private static List<String> splitByLineCount(String s, int maxLines) {
		String[] lines = s.split("\\n");
		List<String> out = new ArrayList<>();
		StringBuilder buf = new StringBuilder();
		int cnt = 0;
		for (String line : lines) {
			if (cnt >= maxLines) {
				out.add(buf.toString().strip());
				buf.setLength(0);
				cnt = 0;
			}
			appendWithSep(buf, line);
			cnt++;
		}
		if (buf.length() > 0)
			out.add(buf.toString().strip());
		return out;
	}

	private static boolean wouldExceed(StringBuilder cur, String next,
		int maxLines, int maxChars) {
		int lines = (cur.length() == 0 ? 0 : countLines(cur.toString())) + countLines(next);
		int chars = cur.length() + (cur.length() == 0 ? 0 : 1) + next.length(); // '\n' 포함
		return lines > maxLines || chars > maxChars;
	}

	private static void addWithRollOver(List<String> chunks, String piece, StringBuilder cur) {
		if (wouldExceed(cur, piece, TARGET_MAX_LINES, HARD_MAX_CHARS)) {
			rollOver(chunks, cur);
		}
		appendWithSep(cur, piece);
	}

	private static void rollOver(List<String> chunks, StringBuilder cur) {
		if (cur.length() > 0) {
			chunks.add(cur.toString().strip());
			cur.setLength(0);
		}
	}

	private static void flush(List<String> chunks, StringBuilder cur) {
		if (cur.length() > 0) {
			chunks.add(cur.toString().strip());
			cur.setLength(0);
		}
	}

	private static void appendWithSep(StringBuilder sb, String block) {
		if (sb.length() > 0)
			sb.append('\n');
		sb.append(block);
	}

	private static List<String> enforceHardMax(List<String> chunks) {
		List<String> out = new ArrayList<>();
		for (String c : chunks) {
			if (c.length() > HARD_MAX_CHARS || countLines(c) > TARGET_MAX_LINES) {
				out.addAll(splitByLineCount(c, TARGET_MAX_LINES));
			} else {
				out.add(c);
			}
		}
		return out;
	}
}
