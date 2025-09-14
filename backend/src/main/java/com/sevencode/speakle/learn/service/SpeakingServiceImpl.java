package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.client.EtriPronunciationClient;
import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import com.sevencode.speakle.learn.domain.entity.SpeakingEntity;
import com.sevencode.speakle.learn.domain.entity.SpeakingResultEntity;
import com.sevencode.speakle.learn.dto.request.SpeakingEvaluationRequest;
import com.sevencode.speakle.learn.dto.response.EtriPronunciationResponse;
import com.sevencode.speakle.learn.dto.response.SpeakingEvaluationResponse;
import com.sevencode.speakle.learn.dto.response.SpeakingQuestionResponse;
import com.sevencode.speakle.learn.exception.*;
import com.sevencode.speakle.learn.repository.LearnedSongRepository;
import com.sevencode.speakle.learn.repository.SpeakingRepository;
import com.sevencode.speakle.learn.repository.SpeakingResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SpeakingServiceImpl implements SpeakingService{
    private final LearnedSongRepository learnedSongRepository;
    private final SpeakingRepository speakingRepository;
    private final SpeakingResultRepository speakingResultRepository;
    private final EtriPronunciationClient etriClient;

    @Value("${speaking.score.threshold}")
    private Double scoreThreshold; // 정답 판정 기준 점수

    @Override
    public SpeakingQuestionResponse getSpeakingQuestion(Long learnedSongId, Integer questionNumber, Long userId) {
        // 1. 학습곡 존재 및 권한 확인
        LearnedSongEntity learned = learnedSongRepository.findById(learnedSongId)
                .orElseThrow(() -> new LearnedSongNotFoundException("존재하지 않는 학습곡입니다."));

        if (!Objects.equals(learned.getUserId(), userId)) {
            throw new UnauthorizedAccessException("접근할 수 있는 권한이 없습니다.");
        }

        // 2. 기존에 동일한 learned_song_id와 question_number로 생성된 speaking 문제가 있는지 확인
        Optional<SpeakingEntity> existingSpeaking = speakingRepository
                .findByLearnedSongIdAndQuestionNumber(learnedSongId, questionNumber);

        if (existingSpeaking.isPresent()) {
            // 기존 데이터가 있으면 해당 데이터 반환
            SpeakingEntity speaking = existingSpeaking.get();
            return new SpeakingQuestionResponse(
                    speaking.getSpeakingId(),
                    speaking.getLearnedSongId(),
                    speaking.getSongId(),
                    speaking.getOriginSentence()
            );
        }

        // 3. 기존 데이터가 없으면 새로운 speaking 문제 생성
        // 3-1. 해당 학습곡의 문장 개수 확인
        // TODO : Sentence 테이블에서 learnedSongId인 데이터 개수 계산하기
        // long sentenceCount = sentenceRepository.countByLearnedSongId(learnedSongId);
        // 테스트용 더미 값
        long sentenceCount = 6;
        //

        if (sentenceCount == 0) {
            throw new NoSentenceAvailableException("해당 학습 곡에서 추출할 문장이 없습니다.");
        }

        // 3-2. 문장 조회 (학습한 sentence에서 가져오기)
        // TODO : Sentence 테이블에서 Sentence 객체 기져오기
        //  List<SentencesEntity> sentences = sentencesRepository.findByLearnedSongIdOrderBySentencesIdAsc(learnedSongId);
        // 테스트용 더미 값
        List<String> sentences = new ArrayList<>(Arrays.asList(
                "The club isn't the best place to find a lover",
                "I've been tryna call",
                "Sin City's cold and empty",
                "I said ooh I'm blinede by the lights",
                "I'm running out of time",
                "So I hit the road in overdrive"));
        //

        int index;
        if(sentenceCount == 6){
            index = (questionNumber - 1) * 2;   // 스피킹 게임에 1, 3, 5번 문장 가져오기
        }else{
            index = questionNumber - 1;         // 스피킹 게임에 1, 2, 3번 문장 가져오기
        }

        if(index >= sentences.size()){
            throw new IllegalArgumentException("해당 questionNumber에 맞는 문장이 존재하지 않습니다.");
        }

//        String coreSentence = sentences.get(index).getSentence();
        // 테스트용 코드
        String coreSentence =  sentences.get(index);
        //

        // 3-3. Speaking 엔티티 생성
        SpeakingEntity speaking = SpeakingEntity.builder()
                .learnedSongId(learned.getLearnedSongId())
                .songId(learned.getSongId())
                .originSentence(coreSentence)
                .level(SpeakingEntity.Level.BEGINNER)
                .questionNumber(questionNumber)
                .situation(learned.getSituation())
                .location(learned.getLocation())
                .build();
        speakingRepository.save(speaking);

        // 3-4. 응답 데이터 생성
        return new SpeakingQuestionResponse(
                speaking.getSpeakingId(),
                learned.getLearnedSongId(),
                learned.getSongId(),
                coreSentence
        );
    }

    public SpeakingEvaluationResponse evaluateSpeaking(Long userId, SpeakingEvaluationRequest request) {
        // 1. 스피킹 문제 존재 여부 확인
        SpeakingEntity speaking = speakingRepository.findById(request.getSpeakingId())
                .orElseThrow(() -> new SpeakingNotFoundException("해당 스피킹 문제를 찾을 수 없습니다."));


        // 2. ETRI API 호출
        EtriPronunciationResponse etriResponse;
        try{
            etriResponse = etriClient
                    .evaluatePronunciation(request.getScript(), request.getAudio())
                    .block();
        } catch(Exception e) {
            throw new PronunciationServerException("발음 평가 서버 호출에 실패했습니다.");
        }

        if (etriResponse == null || etriResponse.getResult() != 0 || etriResponse.getReturnObject() == null) {
            throw new InvalidPronunciationResponseException("발음 평가 서버 응답이 올바르지 않습니다.");
        }


        // 3. 결과 분석
        EtriPronunciationResponse.EtriReturnObject returnObject = etriResponse.getReturnObject();
        String recognized = returnObject.getRecognized();
        String scoreStr = returnObject.getScore();
        Double score = Double.parseDouble(scoreStr);

        // 정수로 변환 (소수점 반올림)
        Integer finalScore = (int) Math.round(score);
        Boolean isCorrect = score >= scoreThreshold;

        // meta 정보 구성
        Map<String, Object> meta = Map.of(
                "originSentence", speaking.getOriginSentence(),
                "recognized", recognized,
                "score", scoreStr   // 원본 점수 저장
        );

        // 4. 기존 결과 확인 및 저장/업데이트
        Optional<SpeakingResultEntity> existingResult = speakingResultRepository
                .findBySpeakingIdAndUserId(request.getSpeakingId(), userId);

        SpeakingResultEntity savedResult;

        if (existingResult.isPresent()) {
            // 기존 결과가 있으면 업데이트
            SpeakingResultEntity result = existingResult.get();
            result.setIsCorrect(isCorrect);
            result.setScore(finalScore);
            result.setMeta(meta);
            result.setCreatedAt(LocalDateTime.now());

            savedResult = speakingResultRepository.save(result);
        } else {
            // 기존 결과가 없으면 새로 생성
            SpeakingResultEntity result = SpeakingResultEntity.builder()
                    .userId(userId)
                    .speakingId(request.getSpeakingId())
                    .isCorrect(isCorrect)
                    .score(finalScore)
                    .meta(meta)
                    .build();

            savedResult = speakingResultRepository.save(result);
        }

        // 5. 포인트 업데이트
        if(isCorrect){
            // TODO : 문제를 맞은 경우 포인트 업데이트 해주기
        }

        // 6. 응답 생성
        return SpeakingEvaluationResponse.builder()
                .speakingResultId(savedResult.getSpeakingResultId())
                .speakingId(savedResult.getSpeakingId())
                .isCorrect(savedResult.getIsCorrect())
                .score(savedResult.getScore())
                .createdAt(savedResult.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'")))
                .meta(savedResult.getMeta())
                .build();
    }
}
