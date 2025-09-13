package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.client.EtriPronunciationClient;
import com.sevencode.speakle.learn.domain.entity.SpeakingEntity;
import com.sevencode.speakle.learn.domain.entity.SpeakingResultEntity;
import com.sevencode.speakle.learn.dto.request.SpeakingEvaluationRequest;
import com.sevencode.speakle.learn.dto.response.EtriPronunciationResponse;
import com.sevencode.speakle.learn.dto.response.SpeakingEvaluationResponse;
import com.sevencode.speakle.learn.exception.InvalidPronunciationResponseException;
import com.sevencode.speakle.learn.exception.PronunciationServerException;
import com.sevencode.speakle.learn.exception.SpeakingNotFoundException;
import com.sevencode.speakle.learn.repository.SpeakingRepository;
import com.sevencode.speakle.learn.repository.SpeakingResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SpeakingServiceImpl implements SpeakingService{
    private final SpeakingRepository speakingRepository;
    private final SpeakingResultRepository speakingResultRepository;
    private final EtriPronunciationClient etriClient;

    @Value("${speaking.score.threshold}")
    private Double scoreThreshold; // 정답 판정 기준 점수

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


        // 4. 결과 저장
        SpeakingResultEntity result = SpeakingResultEntity.builder()
                .userId(userId)
                .speakingId(request.getSpeakingId())
                .isCorrect(isCorrect)
                .score(finalScore)
                .meta(meta)
                .build();

        SpeakingResultEntity savedResult = speakingResultRepository.save(result);


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
