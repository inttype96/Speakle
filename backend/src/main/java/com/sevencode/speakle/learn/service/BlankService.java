package com.sevencode.speakle.learn.service;

import com.sevencode.speakle.learn.dto.request.BlankQuestionRequest;
import com.sevencode.speakle.learn.dto.response.BlankQuestionResponse;
import jakarta.validation.Valid;

public interface BlankService {
    BlankQuestionResponse getBlankQuestion(@Valid BlankQuestionRequest req, Long userId);
}
