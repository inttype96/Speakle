package com.sevencode.speakle.recommend.controller;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.recommend.dto.request.HybridRecommendRequest;
import com.sevencode.speakle.recommend.dto.response.QueryResponse;
import com.sevencode.speakle.recommend.dto.response.RecommendResponse;
import com.sevencode.speakle.recommend.service.RecommendService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommend")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class RecommendController {

    private final RecommendService recommendService;

    @PostMapping("/hybrid")
    public ResponseEntity<RecommendResponse> recommendHybrid(@AuthenticationPrincipal UserPrincipal me, @RequestBody HybridRecommendRequest request) {
        Long userId = me.userId();
        RecommendResponse response = recommendService.recommendHybrid(userId, request);
        return ResponseEntity.ok(response);
    }
}

