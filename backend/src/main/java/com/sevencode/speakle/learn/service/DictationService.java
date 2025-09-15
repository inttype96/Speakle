package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.dto.request.DictationEvaluationRequest;
import com.sevencode.speakle.learn.dto.request.DictationQuestionRequest;
import com.sevencode.speakle.learn.dto.response.DictationCompleteResponse;
import com.sevencode.speakle.learn.dto.response.DictationEvaluationResponse;
import com.sevencode.speakle.learn.dto.response.DictationQuestionResponse;

public interface DictationService {
    DictationQuestionResponse getDictationQuestion(DictationQuestionRequest request, Long userId);
    DictationEvaluationResponse saveDictationResult(DictationEvaluationRequest request, Long userId);
    DictationCompleteResponse getDictationComplete(Long learnedSongId, Long userId);
}
