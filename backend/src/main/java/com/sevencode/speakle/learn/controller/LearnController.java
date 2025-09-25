package com.sevencode.speakle.learn.controller;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.learn.dto.request.*;
import com.sevencode.speakle.learn.dto.response.*;
import com.sevencode.speakle.learn.exception.LearnedSongNotFoundException;
import com.sevencode.speakle.learn.service.BlankService;

import com.sevencode.speakle.learn.service.DictationService;
import com.sevencode.speakle.learn.service.SpeakingService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learn")
public class LearnController {

    private final SpeakingService speakingService;
    private final BlankService blankService;
    private final DictationService dictationService;

    /**
     * 빈칸 문제 생성(조회)
     */
    @PostMapping("/quiz/generate")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<BlankQuestionResponse>> generateQuiz(
            @Valid @RequestBody BlankQuestionRequest req,
            @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me.userId();
        BlankQuestionResponse res = blankService.getBlankQuestion(req, userId);
        return ResponseEntity.ok(ApiResponse.success(200, "스피킹 평가 문장을 조회했습니다.", res));
    }

    /**
     * 빈칸 퀴즈 채점 결과 저장
     */
    @PostMapping("/quiz/marking")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<BlankResultResponse>> saveBlankResult(
            @Valid @RequestBody BlankResultRequest request,
            @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me.userId();
        BlankResultResponse response = blankService.saveBlankResult(request, userId);
        return ResponseEntity.ok(
                ApiResponse.success(200, "퀴즈 결과가 저장되었습니다.", response)
        );
    }


    /**
     * 빈칸 퀴즈 완료
     */
    @GetMapping("/quiz/complete")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<BlankCompleteResponse>> getQuizComplete(
            @RequestParam("learnedSongId") Long learnedSongId,
            @AuthenticationPrincipal UserPrincipal me) {
        // 입력 유효성 검증
        if (learnedSongId == null || learnedSongId <= 0) {
            throw new LearnedSongNotFoundException("유효하지 않은 학습곡 ID입니다.");
        }
        Long userId = me.userId();
        BlankCompleteResponse response = blankService.getBlankComplete(learnedSongId, userId);
        return ResponseEntity.ok(
                ApiResponse.success(200, "퀴즈가 완료되었습니다.", response)
        );
    }

    /**
     * 딕테이션 문제 생성(조회)
     */
    @PostMapping("/dictation/start")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<DictationQuestionResponse>> startDictation(
            @RequestBody DictationQuestionRequest request,
            @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me.userId();
        DictationQuestionResponse response = dictationService.getDictationQuestion(request, userId);
        return ResponseEntity.ok(
                ApiResponse.success(200, "딕테이션 평가 문장을 조회했습니다.", response)
        );
    }

    /**
     * 딕테이션 문제 채점 결과 저장
     */
    @PostMapping("/dictation/result")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<DictationEvaluationResponse>> saveDictationResult(
            @RequestBody DictationEvaluationRequest request,
            @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me.userId();
        DictationEvaluationResponse response = dictationService.saveDictationResult(request, userId);
        return ResponseEntity.ok(
                ApiResponse.success(200, "딕테이션 결과가 저장되었습니다.", response)
        );
    }


    /**
     * 딕테이션 퀴즈 완료 결과 조회
     */
    @GetMapping("/dictation/complete")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<DictationCompleteResponse>> getDictationComplete(
            @RequestParam("learnedSongId") Long learnedSongId,
            @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me.userId();
        DictationCompleteResponse response = dictationService.getDictationComplete(learnedSongId, userId);
        return ResponseEntity.ok(
                ApiResponse.success(200, "딕테이션 테스트가 완료 되었습니다.", response)
        );
    }

    /**
     * 스피킹 평가 문제 생성(조회)
     */
    @PostMapping("/speaking/evaluate")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SpeakingQuestionResponse>> getSpeakingQuestion(
            @Valid @RequestBody SpeakingQuestionRequest req,
            @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me.userId();
        SpeakingQuestionResponse res = speakingService.getSpeakingQuestion(req, userId);
        return ResponseEntity.ok(ApiResponse.success(200, "스피킹 평가 문장을 조회했습니다.", res));
    }


    /**
     * 스피킹 평가 채점 & 결과 저장
     */
    @PostMapping(value = "/speaking/result", consumes = MediaType.APPLICATION_JSON_VALUE)
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SpeakingEvaluationResponse>> evaluateSpeaking(
            @Valid @RequestBody SpeakingEvaluationRequest request,
            @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me.userId();
        SpeakingEvaluationResponse response = speakingService.evaluateSpeaking(userId, request);
        return ResponseEntity.ok(
                ApiResponse.success(200, "스피킹 결과가 저장되었습니다.", response)
        );
    }

    /**
     * 스피킹 게임 완료 결과 조회
     */
    @GetMapping("/speaking/complete")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SpeakingCompleteResponse>> getSpeakingComplete(
            @RequestParam("learnedSongId") Long learnedSongId,
            @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me.userId();
        SpeakingCompleteResponse response = speakingService.getSpeakingComplete(learnedSongId, userId);
        return ResponseEntity.ok(
                ApiResponse.success(200, "스피킹 테스트가 완료 되었습니다.", response)
        );
    }
}