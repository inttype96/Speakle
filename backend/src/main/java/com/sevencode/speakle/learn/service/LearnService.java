package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.dto.response.SpeakingQuestionResponse;

public interface LearnService {
    SpeakingQuestionResponse getSpeakingQuestion(Long learnedSongId, Integer questionNumber, Long userId);
}
