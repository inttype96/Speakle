package com.sevencode.speakle.learn.controller;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.learn.dto.request.*;
import com.sevencode.speakle.learn.dto.response.*;
import com.sevencode.speakle.learn.service.BlankService;
import com.sevencode.speakle.learn.service.LearnService;

import com.sevencode.speakle.learn.service.SpeakingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/learn")
public class LearnController {

    private final LearnService learnService;
    private final SpeakingService speakingService;
    private final BlankService blankService;

    /**
     * 빈칸 문제 생성(조회)
     */
    @PostMapping("/quiz/generate")
    public ResponseEntity<ApiResponse<BlankQuestionResponse>> generateQuiz(@Valid @RequestBody BlankQuestionRequest req,
                                                              @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me.userId();

        BlankQuestionResponse res = blankService.getBlankQuestion(req, userId);
        return ResponseEntity.ok(ApiResponse.success(200, "스피킹 평가 문장을 조회했습니다.", res));
    }

    /**
     * 빈칸 퀴즈 채점 결과 저장
     */
    @PostMapping("/quiz/marking")
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
    public ResponseEntity<ApiResponse<BlankCompleteResponse>> getQuizComplete(
            @RequestBody BlankCompleteRequest request,
            @AuthenticationPrincipal UserPrincipal me) {

        Long userId = me.userId();
        BlankCompleteResponse response = blankService.getBlankComplete(request.getLearnedSongId(), userId);

        return ResponseEntity.ok(
                ApiResponse.success(200, "퀴즈가 완료되었습니다.", response)
        );
    }

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

    @PostMapping(value = "/speaking/result", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<SpeakingEvaluationResponse>> evaluateSpeaking(
            @Valid @RequestBody SpeakingEvaluationRequest request,
            @AuthenticationPrincipal UserPrincipal me) {

        try {
            Long userId = me.userId();
            SpeakingEvaluationResponse response = speakingService.evaluateSpeaking(userId, request);
            return ResponseEntity.ok(
                    ApiResponse.success(200, "스피킹 결과가 저장되었습니다.", response)
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.success(400, "요청 값이 올바르지 않습니다.", null)
            );
        } catch (RuntimeException e) {
            if (e.getMessage().contains("인증키")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                        ApiResponse.success(401, e.getMessage(), null)
                );
            } else if (e.getMessage().contains("찾을 수 없습니다")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        ApiResponse.success(404, e.getMessage(), null)
                );
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                        ApiResponse.success(500, e.getMessage(), null)
                );
            }
        }
    }
}