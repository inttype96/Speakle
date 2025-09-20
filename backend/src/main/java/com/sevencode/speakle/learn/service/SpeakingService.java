package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.dto.request.SpeakingEvaluationRequest;
import com.sevencode.speakle.learn.dto.request.SpeakingQuestionRequest;
import com.sevencode.speakle.learn.dto.response.SpeakingCompleteResponse;
import com.sevencode.speakle.learn.dto.response.SpeakingEvaluationResponse;
import com.sevencode.speakle.learn.dto.response.SpeakingQuestionResponse;

public interface SpeakingService {
    SpeakingQuestionResponse getSpeakingQuestion(SpeakingQuestionRequest req, Long userId);
    SpeakingEvaluationResponse evaluateSpeaking(Long userId, SpeakingEvaluationRequest request);
    SpeakingCompleteResponse getSpeakingComplete(Long learnedSongId, Long userId);
}
