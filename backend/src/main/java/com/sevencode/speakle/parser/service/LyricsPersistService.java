package com.sevencode.speakle.parser.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sevencode.speakle.parser.repository.*;
import com.sevencode.speakle.parser.entity.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * LyricsPersistService
 * - 역할: 파싱 결과(JSON)를 DB 엔터티로 저장/조회.
 * - 규칙: (songId + 자연키) 중복은 건너뜀, 필수 필드 없으면 저장하지 않음.
 * - 비고: level 값은 상위 서비스에서 CEFR(A1~C2)로 정규화되어 들어온다고 가정.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LyricsPersistService {

	// 리포지토리 주입
	private final WordRepository wordRepo;
	private final ExpressionRepository exprRepo;
	private final IdiomRepository idiomRepo;
	private final SentenceRepository sentRepo;

	private final ObjectMapper objectMapper; // DB→JSON 역직렬화용

	/** 해당 곡에 어떤 카테고리든 기 저장 여부 빠른 확인 */
	public boolean existsAny(String songId) {
		return wordRepo.existsBySongId(songId)
			|| exprRepo.existsBySongId(songId)
			|| idiomRepo.existsBySongId(songId)
			|| sentRepo.existsBySongId(songId);
	}

	/** Context-aware 해당 곡에 어떤 카테고리든 기 저장 여부 빠른 확인 */
	public boolean existsAnyWithContext(String songId, String situation, String location) {
		return wordRepo.existsBySongIdAndSituationAndLocation(songId, situation, location)
			|| exprRepo.existsBySongIdAndSituationAndLocation(songId, situation, location)
			|| idiomRepo.existsBySongIdAndSituationAndLocation(songId, situation, location)
			|| sentRepo.existsBySongIdAndSituationAndLocation(songId, situation, location);
	}

	/** DB → 파싱 스키마(JSON) 형태로 재구성하여 반환 (검수/재사용용) */
	public ObjectNode loadAsJson(String songId) {
		return loadAsJsonWithContext(songId, null, null);
	}

	/** Context-aware DB → JSON 변환 */
	public ObjectNode loadAsJsonWithContext(String songId, String situation, String location) {
		ObjectNode root = objectMapper.createObjectNode();

		var words = objectMapper.createArrayNode();
		var wordList = (situation == null && location == null) ?
			wordRepo.findAllBySongId(songId) :
			wordRepo.findAllBySongIdAndSituationAndLocation(songId, situation, location);

		for (var e : wordList) {
			var n = objectMapper.createObjectNode();
			n.put("word", e.getWord());
			n.put("phonetic", nullSafe(e.getPhonetic()));
			n.put("meaning", nullSafe(e.getMeaning()));
			n.put("pos", nullSafe(e.getPos()));
			n.put("examples", nullSafe(e.getExamples()));
			n.put("level", nullSafe(e.getLevel()));
			n.put("tags", nullSafe(e.getTags()));
			words.add(n);
		}

		var exps = objectMapper.createArrayNode();
		var expList = (situation == null && location == null) ?
			exprRepo.findAllBySongId(songId) :
			exprRepo.findAllBySongIdAndSituationAndLocation(songId, situation, location);

		for (var e : expList) {
			var n = objectMapper.createObjectNode();
			n.put("expression", e.getExpression());
			n.put("meaning", nullSafe(e.getMeaning()));
			n.put("context", nullSafe(e.getContext()));
			n.put("examples", nullSafe(e.getExamples()));
			n.put("tags", nullSafe(e.getTags()));
			n.put("level", nullSafe(e.getLevel()));
			exps.add(n);
		}

		var idioms = objectMapper.createArrayNode();
		var idiomList = (situation == null && location == null) ?
			idiomRepo.findAllBySongId(songId) :
			idiomRepo.findAllBySongIdAndSituationAndLocation(songId, situation, location);

		for (var e : idiomList) {
			var n = objectMapper.createObjectNode();
			n.put("phrase", e.getPhrase());
			n.put("meaning", nullSafe(e.getMeaning()));
			n.put("examples", nullSafe(e.getExamples()));
			n.put("level", nullSafe(e.getLevel()));
			n.put("tags", nullSafe(e.getTags()));
			idioms.add(n);
		}

		var sents = objectMapper.createArrayNode();
		var sentList = (situation == null && location == null) ?
			sentRepo.findAllBySongId(songId) :
			sentRepo.findAllBySongIdAndSituationAndLocation(songId, situation, location);

		for (var e : sentList) {
			var n = objectMapper.createObjectNode();
			n.put("sentence", e.getSentence());
			n.put("translation", nullSafe(e.getTranslation()));
			n.put("tags", nullSafe(e.getTags()));
			n.put("level", nullSafe(e.getLevel()));
			sents.add(n);
		}

		root.set("words", words);
		root.set("expressions", exps);
		root.set("idioms", idioms);
		root.set("sentences", sents);
		return root;
	}

	private static String nullSafe(String s) {
		return s == null ? null : s;
	}

	/** 트랜잭션 1회로 4개 카테고리를 일괄 저장 (이미 있으면 skip) */
	@Transactional
	public void saveAll(String learnedSongId, ObjectNode parsed) {
		saveAllWithContext(learnedSongId, parsed, null, null);
	}

	/** Context-aware 저장 메서드 */
	@Transactional
	public void saveAllWithContext(String learnedSongId, ObjectNode parsed, String situation, String location) {
		saveWordsWithContext(learnedSongId, parsed.withArray("words"), situation, location);
		saveExpressionsWithContext(learnedSongId, parsed.withArray("expressions"), situation, location);
		saveIdiomsWithContext(learnedSongId, parsed.withArray("idioms"), situation, location);
		saveSentencesWithContext(learnedSongId, parsed.withArray("sentences"), situation, location);
	}

	/** key: (songId + word, 대소문자 무시). meaning 없으면 저장 안 함. */
	private void saveWords(String songId, ArrayNode arr) {
		saveWordsWithContext(songId, arr, null, null);
	}

	/** Context-aware words 저장 */
	private void saveWordsWithContext(String songId, ArrayNode arr, String situation, String location) {
		for (JsonNode n : arr) {
			String word = text(n, "word");
			if (isBlank(word))
				continue;
			if (wordRepo.findBySongIdAndWordIgnoreCase(songId, word).isPresent())
				continue;

			WordEntity e = new WordEntity();
			e.setSongId(songId);
			e.setSituation(situation);
			e.setLocation(location);
			e.setWord(word);
			e.setPhonetic(text(n, "phonetic"));
			e.setMeaning(text(n, "meaning"));
			e.setPos(text(n, "pos"));
			e.setExamples(text(n, "examples"));
			e.setLevel(text(n, "level"));   // CEFR(A1~C2) 가정
			e.setTags(text(n, "tags"));
			if (!isBlank(e.getMeaning()))
				wordRepo.save(e);
		}
	}

	/** key: (songId + expression). meaning 없으면 저장 안 함. */
	private void saveExpressions(String songId, ArrayNode arr) {
		saveExpressionsWithContext(songId, arr, null, null);
	}

	/** Context-aware expressions 저장 */
	private void saveExpressionsWithContext(String songId, ArrayNode arr, String situation, String location) {
		for (JsonNode n : arr) {
			String exp = text(n, "expression");
			if (isBlank(exp))
				continue;
			if (exprRepo.findBySongIdAndExpressionIgnoreCase(songId, exp).isPresent())
				continue;

			ExpressionEntity e = new ExpressionEntity();
			e.setSongId(songId);
			e.setSituation(situation);
			e.setLocation(location);
			e.setExpression(exp);
			e.setMeaning(text(n, "meaning"));
			e.setContext(text(n, "context"));
			e.setExamples(text(n, "examples"));
			e.setTags(text(n, "tags"));
			e.setLevel(text(n, "level"));   // CEFR(A1~C2) 가정
			if (!isBlank(e.getMeaning()))
				exprRepo.save(e);
		}
	}

	/** key: (songId + phrase). meaning 없으면 저장 안 함. */
	private void saveIdioms(String songId, ArrayNode arr) {
		saveIdiomsWithContext(songId, arr, null, null);
	}

	/** Context-aware idioms 저장 */
	private void saveIdiomsWithContext(String songId, ArrayNode arr, String situation, String location) {
		for (JsonNode n : arr) {
			String phrase = text(n, "phrase");
			if (isBlank(phrase))
				continue;
			if (idiomRepo.findBySongIdAndPhraseIgnoreCase(songId, phrase).isPresent())
				continue;

			IdiomEntity e = new IdiomEntity();
			e.setSongId(songId);
			e.setSituation(situation);
			e.setLocation(location);
			e.setPhrase(phrase);
			e.setMeaning(text(n, "meaning"));
			e.setExamples(text(n, "examples"));
			e.setLevel(text(n, "level"));   // CEFR(A1~C2) 가정
			e.setTags(text(n, "tags"));
			if (!isBlank(e.getMeaning()))
				idiomRepo.save(e);
		}
	}

	/** key: (songId + sentence). translation 없으면 저장 안 함. */
	private void saveSentences(String songId, ArrayNode arr) {
		saveSentencesWithContext(songId, arr, null, null);
	}

	/** Context-aware sentences 저장 */
	private void saveSentencesWithContext(String songId, ArrayNode arr, String situation, String location) {
		for (JsonNode n : arr) {
			String sentence = text(n, "sentence");
			if (isBlank(sentence))
				continue;
			if (sentRepo.findBySongIdAndSentenceIgnoreCase(songId, sentence).isPresent())
				continue;

			SentenceEntity e = new SentenceEntity();
			e.setSongId(songId);
			e.setSituation(situation);
			e.setLocation(location);
			e.setSentence(sentence);
			e.setTranslation(text(n, "translation")); // 문장 카테고리는 번역이 핵심
			e.setTags(text(n, "tags"));
			e.setLevel(text(n, "level"));             // CEFR(A1~C2) 가정
			if (!isBlank(e.getTranslation()))
				sentRepo.save(e);
		}
	}

	// JSON 헬퍼
	private static String text(JsonNode n, String f) {
		return (n != null && n.hasNonNull(f)) ? n.get(f).asText().trim() : null;
	}

	private static boolean isBlank(String s) {
		return s == null || s.isBlank();
	}
}
