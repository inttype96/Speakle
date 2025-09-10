package com.sevencode.speakle.learn.controller;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.learn.dto.request.SpeakingQuestionRequest;
import com.sevencode.speakle.learn.dto.response.ApiResponse;
import com.sevencode.speakle.learn.dto.response.SpeakingQuestionResponse;
import com.sevencode.speakle.learn.service.LearnService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learn")
public class LearnController {

    private final LearnService learnService;

    /**
     * 스피킹 평가 문제 생성(조회)
     */
    @PostMapping("/speaking/evaluate")
    public ResponseEntity<ApiResponse<SpeakingQuestionResponse>> getSpeakingQuestion(
            @Valid @RequestBody SpeakingQuestionRequest req,
            @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me.userId();
        SpeakingQuestionResponse res = learnService.getSpeakingQuestion(req.getLearnedSongId(), req.getQuestionNumber(), userId);

        return ResponseEntity.ok(ApiResponse.success(200, "스피킹 평가 문장을 조회했습니다.", res));
    }
}