package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.dto.request.SpeakingEvaluationRequest;
import com.sevencode.speakle.learn.dto.response.SpeakingEvaluationResponse;

public interface SpeakingService {
    SpeakingEvaluationResponse evaluateSpeaking(Long userId, SpeakingEvaluationRequest request);
}
