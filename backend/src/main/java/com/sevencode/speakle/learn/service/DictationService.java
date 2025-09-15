package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.dto.request.DictationQuestionRequest;
import com.sevencode.speakle.learn.dto.response.DictationQuestionResponse;

public interface DictationService {
    DictationQuestionResponse getDictationQuestion(DictationQuestionRequest request, Long userId);
}
