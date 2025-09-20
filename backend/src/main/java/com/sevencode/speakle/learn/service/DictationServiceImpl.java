package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.domain.entity.DictationEntity;
import com.sevencode.speakle.learn.domain.entity.DictationResultEntity;
import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import com.sevencode.speakle.learn.dto.request.DictationEvaluationRequest;
import com.sevencode.speakle.learn.dto.request.DictationQuestionRequest;
import com.sevencode.speakle.learn.dto.response.DictationCompleteResponse;
import com.sevencode.speakle.learn.dto.response.DictationEvaluationResponse;
import com.sevencode.speakle.learn.dto.response.DictationQuestionResponse;
import com.sevencode.speakle.learn.exception.*;
import com.sevencode.speakle.learn.repository.DictationRepository;
import com.sevencode.speakle.learn.repository.DictationResultRepository;
import com.sevencode.speakle.learn.repository.LearnedSongRepository;
import com.sevencode.speakle.song.domain.LyricChunk;
import com.sevencode.speakle.song.domain.Song;
import com.sevencode.speakle.song.repository.LyricChunkRepository;
import com.sevencode.speakle.song.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DictationServiceImpl implements DictationService{

    private final LearnedSongRepository learnedSongRepository;
    private final DictationRepository dictationRepository;
    private final DictationResultRepository dictationResultRepository;
    private final SongRepository songRepository;
    private final LyricChunkRepository lyricChunkRepository;

    /**
     * 딕테이션 문제 생성(조회)
     */
    @Override
    public DictationQuestionResponse getDictationQuestion(DictationQuestionRequest request, Long userId) {
        // 1. LearnedSong 조회
        LearnedSongEntity learnedSong = learnedSongRepository.findById(request.getLearnedSongId())
                .orElseThrow(() -> new LearnedSongNotFoundException("존재하지 않는 학습곡입니다."));

        // 2. 기존 딕테이션 조회 또는 생성
        DictationEntity dictation = findOrCreateDictation(request, learnedSong);

        // 3. 곡 정보 조회
         Song song = songRepository.findById(learnedSong.getSongId())
                 .orElseThrow(() -> new RuntimeException("곡 정보를 찾을 수 없습니다."));

        // 4. 응답 데이터 생성
         DictationQuestionResponse res = buildDictationData(dictation, song);
         return res;
    }


    // ------------------------------------------------------------
    // 기존 딕테이션 조회 또는 새로 생성
    // ------------------------------------------------------------
    private DictationEntity findOrCreateDictation(DictationQuestionRequest request, LearnedSongEntity learnedSong) {
        // 기존 딕테이션 조회
        Optional<DictationEntity> existingDictation = dictationRepository
                .findByLearnedSongIdAndQuestionNumber(request.getLearnedSongId(), request.getQuestionNumber());

        if (existingDictation.isPresent()) {
            return existingDictation.get();
        } else {
            // 새로운 딕테이션 생성
            DictationEntity newDictation = createNewDictation(request, learnedSong);
            return newDictation;
        }
    }

    // ------------------------------------------------------------
    // 새로운 딕테이션 생성
    // ------------------------------------------------------------
    private DictationEntity createNewDictation(DictationQuestionRequest request, LearnedSongEntity learnedSong) {
        log.info("Creating dictation for learnedSongId: {}, questionNumber: {}",
                request.getLearnedSongId(), request.getQuestionNumber());
        String sondId = learnedSong.getSongId();
        // 2. 해당 songId의 모든 가사 조회
         List<LyricChunk> allLyrics = lyricChunkRepository.findBySongSongIdAndEnglishIsNotNullOrderByStartTimeMsAsc(sondId);

         if (allLyrics.isEmpty()) {
             throw new NoSentenceAvailableException("사용 가능한 가사가 없습니다.");
         }

        // 3. 이미 사용된 문장들 조회 (중복 방지)
         List<String> usedSentences = dictationRepository.findUsedSentencesByLearnedSongId(request.getLearnedSongId());

        // 4. 사용되지 않은 가사 필터링
         List<LyricChunk> availableLyrics = allLyrics.stream()
                 .filter(lyrics -> !usedSentences.contains(lyrics.getEnglish()))
                 .filter(this::isValidLyricForDictation)
                 .collect(Collectors.toList());

         if (availableLyrics.isEmpty()) {
             throw new RuntimeException("더 이상 사용 가능한 가사가 없습니다.");
         }

        // 5. 랜덤으로 가사 선택
         Random random = new Random();
         LyricChunk selectedLyrics = availableLyrics.get(random.nextInt(availableLyrics.size()));


        // 6. 다음 가사 정보 조회하기
        Long endTime = calculateEndTime(selectedLyrics, allLyrics);

        // 7. 딕테이션 세션 생성
        DictationEntity dictation = DictationEntity.builder()
                .learnedSongId(request.getLearnedSongId())
                .situation(learnedSong.getSituation())
                .location(learnedSong.getLocation())
                .songId(learnedSong.getSongId())
                .startTime(selectedLyrics.getStartTimeMs())
                .endTime(endTime)
                .originSentence(selectedLyrics.getEnglish())
                .answer(selectedLyrics.getEnglish())
                .level(DictationEntity.Level.BEGINNER)
                .questionNumber(request.getQuestionNumber())
                .build();
        return dictationRepository.save(dictation);
    }

    // ------------------------------------------------------------
    // 가사가 딕테이션 문제로 적합한지 검증
    // ------------------------------------------------------------
    private boolean isValidLyricForDictation(LyricChunk lyric) {
        String english = lyric.getEnglish();

        if (english == null || english.trim().isEmpty()) {
            return false;
        }

        // 길이 검증 (너무 짧거나 긴 문장 제외)
        int wordCount = english.trim().split("\\s+").length;
        if (wordCount < 5 || wordCount > 30) {
            return false;
        }

        // 감탄사나 반복 문자 패턴 제외
        String lowerCase = english.toLowerCase();
        if (lowerCase.matches(".*([a-z])\\1{3,}.*") || // 같은 문자 4번 이상 반복
                lowerCase.matches(".*(oh+|ah+|yeah+|la+|na+).*") || // 감탄사 패턴
                lowerCase.contains("...") || // 생략 부호
                english.length() < 10) { // 너무 짧은 문장
            return false;
        }
        return true;
    }

    // ------------------------------------------------------------
    // endTime 계산 (다음 가사의 시작 시간 또는 기본 duration 추가)
    // ------------------------------------------------------------
    private Long calculateEndTime(LyricChunk selectedLyrics, List<LyricChunk> allLyrics) {
        Long startTime = selectedLyrics.getStartTimeMs();

        // 다음 가사 찾기
        Optional<LyricChunk> nextLyric = allLyrics.stream()
                .filter(lyric -> lyric.getStartTimeMs() > startTime)
                .findFirst();

        if (nextLyric.isPresent()) {
            return nextLyric.get().getStartTimeMs();
        } else {
            // 다음 가사가 없으면 기본 10초 추가
            return startTime + 5000L;
        }
    }

    // ------------------------------------------------------------
    // 딕테이션 응답 데이터 생성
    // ------------------------------------------------------------
     private DictationQuestionResponse buildDictationData(DictationEntity dictation, Song song) {
        // duration 계산
        Long duration = dictation.getEndTime() - dictation.getStartTime();

        return DictationQuestionResponse.builder()
                .dictationId(dictation.getDictationId())
                .questionNumber(dictation.getQuestionNumber())
                .learnedSongId(dictation.getLearnedSongId())
                .songId(dictation.getSongId())
                .title(song.getTitle())
                .artists(song.getArtists())
                .coreSentence(dictation.getOriginSentence())
                .startTime(dictation.getStartTime())
                .duration(duration)
                .endTime(dictation.getEndTime())
                .createdAt(dictation.getCreatedAt())
                .build();
    }

    /**
     * 딕테이션 문제 채점 결과 저장
     */
    @Override
    public DictationEvaluationResponse saveDictationResult(DictationEvaluationRequest request, Long userId) {
        // 1. 딕테이션 문제 존재 여부 확인
        DictationEntity dictation = dictationRepository.findById(request.getDictationId())
                .orElseThrow(() -> new DictationNotFoundException("해당 딕테이션 문제를 찾을 수 없습니다."));

        // 2. 학습곡 존재 및 권한 확인
        Long learnedSongId = dictation.getLearnedSongId();
        LearnedSongEntity learned = learnedSongRepository.findById(learnedSongId)
                .orElseThrow(() -> new LearnedSongNotFoundException("존재하지 않는 학습곡입니다."));

        if (!Objects.equals(learned.getUserId(), userId)) {
            throw new UnauthorizedAccessException("접근할 수 있는 권한이 없습니다.");
        }

        // 3. 기존 BlankResult 존재 여부 확인
        Optional<DictationResultEntity> existingDictationResult = dictationResultRepository
                .findByDictationIdAndUserId(request.getDictationId(), request.getUserId());

        DictationResultEntity dictationResult;

        if (existingDictationResult.isPresent()) {
            // 기존 데이터가 존재하면 업데이트
            dictationResult = existingDictationResult.get();
            dictationResult.setIsCorrect(request.getIsCorrect());
            dictationResult.setScore(request.getScore());
            dictationResult.setMeta(request.getMeta());
        } else {
            // 기존 데이터가 없으면 새로 생성
            dictationResult = DictationResultEntity.builder()
                    .dictationId(request.getDictationId())
                    .userId(request.getUserId())
                    .isCorrect(request.getIsCorrect())
                    .score(request.getScore())
                    .meta(request.getMeta())
                    .build();
        }

        // 4. 결과 저장
        DictationResultEntity savedResult = dictationResultRepository.save(dictationResult);

        // 5. 응답 DTO 변환 후 반환
        return DictationEvaluationResponse.builder()
                .dictationResultId(savedResult.getDictationResultId())
                .userId(savedResult.getUserId())
                .dictationId(savedResult.getDictationId())
                .isCorrect(savedResult.getIsCorrect())
                .score(savedResult.getScore())
                .createdAt(savedResult.getCreatedAt())
                .meta(savedResult.getMeta())
                .build();
    }

    /**
     * 딕테이션 퀴즈 종료
     */
    @Override
    public DictationCompleteResponse getDictationComplete(Long learnedSongId, Long userId) {
        // 1. 권한 확인
        LearnedSongEntity learnedSongEntity = learnedSongRepository.findById(learnedSongId)
                .orElseThrow(() -> new LearnedSongNotFoundException("존재하지 않는 학습곡입니다."));

        if (!Objects.equals(learnedSongEntity.getUserId(), userId)) {
            throw new UnauthorizedAccessException("접근할 수 있는 권한이 없습니다.");
        }

        // 2. learned_song_id로 dictation 테이블에서 데이터 조회
        List<DictationEntity> dictations = dictationRepository.findByLearnedSongId(learnedSongId);

        if (dictations.isEmpty()) {
            throw new DictationNotFoundException("해당 딕테이션 퀴즈를 찾을 수 없습니다.");
        }

        // 3. dictation_id 리스트 추출
        List<Long> dictationIds = dictations.stream()
                .map(DictationEntity::getDictationId)
                .collect(Collectors.toList());

        // 4. dictation_result에서 해당 결과들 조회
        List<DictationResultEntity> dictationResults = dictationResultRepository
                .findByDictationIdInAndUserId(dictationIds, userId);

        if (dictationResults.isEmpty()) {
            throw new DictationResultNotFoundException("딕테이션 퀴즈 결과를 찾을 수 없습니다.");
        }

        // 5. 응답 데이터 구성
        return buildDictationCompleteResponse(dictations, dictationResults);
    }

    // ------------------------------------------------------------
    // 딕테이션 퀴즈 완료 응답 생성
    // ------------------------------------------------------------
    private DictationCompleteResponse buildDictationCompleteResponse(List<DictationEntity> dictations, List<DictationResultEntity> dictationResults) {
        // Dictation 데이터를 Map으로 변환 (빠른 조회를 위해)
        Map<Long, DictationEntity> dictationMap = dictations.stream()
                .collect(Collectors.toMap(DictationEntity::getDictationId, dictation -> dictation));

        List<DictationCompleteResponse.DictationResult> results = new ArrayList<>();
        int correctCount = 0;
        int totalScore = 0;

        for (DictationResultEntity dictationResult : dictationResults) {
            DictationEntity dictation = dictationMap.get(dictationResult.getDictationId());
            if (dictation == null) continue;

            // meta 데이터 파싱
            DictationCompleteResponse.DictationMeta meta = parseDictationMetaData(dictation, dictationResult);

            DictationCompleteResponse.DictationResult result = new DictationCompleteResponse.DictationResult();
            result.setDictationResultId(dictationResult.getDictationResultId());
            result.setUserId(dictationResult.getUserId());
            result.setDictationId(dictationResult.getDictationId());
            result.setIsCorrect(dictationResult.getIsCorrect());
            result.setScore(dictationResult.getScore());
            result.setCreatedAt(dictationResult.getCreatedAt());
            result.setMeta(meta);

            results.add(result);

            if (Boolean.TRUE.equals(dictationResult.getIsCorrect())) {
                correctCount++;
            }
            totalScore += dictationResult.getScore();
        }

        // dictationId를 기준으로 오름차순 정렬
        results.sort(Comparator.comparing(DictationCompleteResponse.DictationResult::getDictationId));

        // Summary 생성
        DictationCompleteResponse.Summary summary = new DictationCompleteResponse.Summary();
        summary.setTotalQuestions(results.size());
        summary.setCorrectAnswers(correctCount);
        summary.setTotalScore(totalScore);

        // 최종 응답 구성
        DictationCompleteResponse res = new DictationCompleteResponse();
        res.setSummary(summary);
        res.setResults(results);
        return res;
    }

    // ------------------------------------------------------------
    // 딕테이션 메타 데이터 생성
    // ------------------------------------------------------------
    private DictationCompleteResponse.DictationMeta parseDictationMetaData(DictationEntity dictation, DictationResultEntity dictationResult) {
        // correctAnswer는 dictation 테이블의 answer 필드에서
        String correctAnswer = dictation.getAnswer();

        // userAnswer는 dictationResult의 meta에서 파싱
        String userAnswer = dictationResult.getMeta().get("userAnswer").toString();

        return DictationCompleteResponse.DictationMeta.builder()
                .userAnswer(userAnswer)
                .correctAnswer(correctAnswer)
                .build();
    }
}
