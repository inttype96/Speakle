package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.dto.request.SpeakingEvaluationRequest;
import com.sevencode.speakle.learn.dto.response.SpeakingEvaluationResponse;
import com.sevencode.speakle.learn.dto.response.SpeakingQuestionResponse;

public interface SpeakingService {
    SpeakingQuestionResponse getSpeakingQuestion(Long learnedSongId, Integer questionNumber, Long userId);
    SpeakingEvaluationResponse evaluateSpeaking(Long userId, SpeakingEvaluationRequest request);
}
