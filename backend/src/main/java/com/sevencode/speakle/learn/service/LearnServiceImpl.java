package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.domain.entity.LearnedSongEntity;
import com.sevencode.speakle.learn.domain.entity.SpeakingEntity;
import com.sevencode.speakle.learn.dto.response.SpeakingQuestionResponse;
import com.sevencode.speakle.learn.exception.LearnedSongNotFoundException;
import com.sevencode.speakle.learn.exception.NoRecommendationSentenceFoundException;
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

        // 2. 문장 조회 (해당 노래에서 랜덤으로 가져오기)
        // TODO : lyrics를 뽑아오기 위해 Song 테이블에서 song 객체 기져오기
        String lyrics = """
                The club isn't the best place to find a lover.
                So the bar is where I go.
                Me and my friends at the table doing shots.
                Drinking faster and then we talk slow.
                Come over and start up a conversation with just me.
                And trust me I'll give it a chance now.
                Take my hand, stop.
                Put Van The Man on the jukebox.
                And then we start to dance.
                And now I'm singing like.
                """;
        //

        String coreSentence = pickRandomSentenceFromLyrics(lyrics, questionNumber);
        if (coreSentence == null || coreSentence.isBlank()) {
            throw new NoRecommendationSentenceFoundException("해당 학습 곡에서 추출할 문장이 없습니다.");
        }

        // 3. Speaking 엔티티 생성
        SpeakingEntity speaking = SpeakingEntity.builder()
                .learnedSongId(learned.getLearnedSongId())
                .songId(learned.getSongId())
                .originSentence(coreSentence)
                .level(SpeakingEntity.Level.BEGINNER)
                .situation(learned.getSituation())
                .location(learned.getLocation())
                .build();
        speakingRepository.save(speaking);

        // 4. 응답 데이터 생성
        return new SpeakingQuestionResponse(
                speaking.getSpeakingId(),
                learned.getLearnedSongId(),
                learned.getSongId(),
                coreSentence
        );
    }

    private String pickRandomSentenceFromLyrics(String lyrics, int questionNumber) {
        if (lyrics == null) return null;

        // 문장부호(. ! ? ; ...) 다음에 오는 공백을 기준으로 분할
        String[] parts = lyrics.split("(?<=[\\.!?;…])\\s+");

        List<String> candidates = new ArrayList<>();
        for (String s : parts) {
            String t = s.strip();
            // 너무 짧은 가사는 제외
            if (t.length() >= 10) candidates.add(t);
        }
        if (candidates.isEmpty()) return null;

        System.out.println("candidates.size() : "+candidates.size());
        for(int i=0;i<candidates.size();i++){
            System.out.println(candidates.get(i));
        }

        int size = candidates.size();
        String selected;

        switch (questionNumber) {
            case 1: // 처음 부분 (1/4)
                int firstIdx = Math.max(0, size / 4);
                selected = candidates.get(firstIdx);
                break;

            case 2: // 중간 부분 (2/4 == 1/2)
                int middleIdx = Math.max(0, size / 2);
                selected = candidates.get(middleIdx);
                break;

            case 3: // 끝 부분 (3/4)
                int lastIdx = Math.max(size-1, (size * 3) / 4);
                selected = candidates.get(lastIdx);
                break;
            default:
                // questionNumber가 1,2,3이 아닌 경우 처음 부분에서 선택
                selected = candidates.get(0);
        }
        return selected;
    }
}
