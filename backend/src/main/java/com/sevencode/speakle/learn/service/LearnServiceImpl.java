package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import com.sevencode.speakle.learn.domain.entity.SpeakingEntity;
import com.sevencode.speakle.learn.dto.response.SpeakingQuestionResponse;
import com.sevencode.speakle.learn.exception.LearnedSongNotFoundException;
import com.sevencode.speakle.learn.exception.NoSentenceAvailableException;
import com.sevencode.speakle.learn.exception.UnauthorizedAccessException;
import com.sevencode.speakle.learn.repository.LearnedSongRepository;
import com.sevencode.speakle.learn.repository.SpeakingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;


@Service
@RequiredArgsConstructor
@Transactional
public class LearnServiceImpl implements LearnService {

    private final LearnedSongRepository learnedSongRepository;
    private final SpeakingRepository speakingRepository;

    @Override
    public SpeakingQuestionResponse getSpeakingQuestion(Long learnedSongId, Integer questionNumber, Long userId) {
        // 1. 학습곡 존재 및 권한 확인
        LearnedSongEntity learned = learnedSongRepository.findById(learnedSongId)
                .orElseThrow(() -> new LearnedSongNotFoundException("존재하지 않는 학습곡입니다."));

        if (!Objects.equals(learned.getUserId(), userId)) {
            throw new UnauthorizedAccessException("접근할 수 있는 권한이 없습니다.");
        }

        // 2. 해당 학습곡의 문장 개수 확인
        // TODO : Sentence 테이블에서 learnedSongId인 데이터 개수 계산하기
        // long sentenceCount = sentenceRepository.countByLearnedSongId(learnedSongId);
        // 테스트용 더미 값
        long sentenceCount = 6;
        //

        if (sentenceCount == 0) {
            throw new NoSentenceAvailableException("해당 학습 곡에서 추출할 문장이 없습니다.");
        }

        // 3. 문장 조회 (학습한 sentence에서 가져오기)
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

        // 4. Speaking 엔티티 생성
        SpeakingEntity speaking = SpeakingEntity.builder()
                .learnedSongId(learned.getLearnedSongId())
                .songId(learned.getSongId())
                .originSentence(coreSentence)
                .level(SpeakingEntity.Level.BEGINNER)
                .situation(learned.getSituation())
                .location(learned.getLocation())
                .build();
        speakingRepository.save(speaking);

        // 5. 응답 데이터 생성
        return new SpeakingQuestionResponse(
                speaking.getSpeakingId(),
                learned.getLearnedSongId(),
                learned.getSongId(),
                coreSentence
        );
    }
}
