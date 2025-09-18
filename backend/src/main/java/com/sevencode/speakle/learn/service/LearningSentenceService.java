package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.domain.entity.LearningSentence;
import com.sevencode.speakle.learn.repository.LearningSentenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningSentenceService {

    private final LearningSentenceRepository learningSentenceRepository;

    @Transactional
    public void saveLearningSentences(Long userId, Long learnedSongId, List<String> coreSentences, List<String> koreanTranslations) {
        log.info("[LearningSentenceService] 학습 문장 저장 시작 - userId={}, learnedSongId={}, sentences={}",
                userId, learnedSongId, coreSentences.size());

        for (int i = 0; i < coreSentences.size(); i++) {
            String coreSentence = coreSentences.get(i);
            String korean = (koreanTranslations != null && i < koreanTranslations.size())
                    ? koreanTranslations.get(i) : null;

            LearningSentence sentence = LearningSentence.builder()
                    .userId(userId)
                    .learnedSongId(learnedSongId)
                    .coreSentence(coreSentence)
                    .korean(korean)
                    .order((long) (i + 1))
                    .build();

            learningSentenceRepository.save(sentence);
        }

        log.info("[LearningSentenceService] 학습 문장 저장 완료 - 총 {}개", coreSentences.size());
    }

    public List<LearningSentence> getLearningSentences(Long learnedSongId) {
        return learningSentenceRepository.findByLearnedSongIdOrderByOrder(learnedSongId);
    }
}