package com.sevencode.speakle.recommend.controller;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.recommend.dto.request.HybridRecommendRequest;
import com.sevencode.speakle.recommend.dto.request.FilterRequest;
import com.sevencode.speakle.recommend.dto.response.QueryResponse;
import com.sevencode.speakle.recommend.dto.response.RecommendResponse;
import com.sevencode.speakle.recommend.dto.response.EnhancedRecommendResponse;
import com.sevencode.speakle.learn.dto.response.ApiResponse;
import com.sevencode.speakle.recommend.service.RecommendService;
import com.sevencode.speakle.song.domain.Song;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommend")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Recommend", description = "노래 추천 API")
public class RecommendController {

    private final RecommendService recommendService;

    // 기본 하이브리드 추천 (하위 호환성 유지)
    @PostMapping("/hybrid")
    public ResponseEntity<RecommendResponse> recommendHybrid(@AuthenticationPrincipal UserPrincipal me, @RequestBody HybridRecommendRequest request) {
        Long userId = me.userId();
        RecommendResponse response = recommendService.recommendHybrid(userId, request);
        return ResponseEntity.ok(response);
    }

    //향상된 하이브리드 추천 (with 메타데이터 및 필터링)
    @PostMapping("/hybrid/enhanced")
    public ResponseEntity<ApiResponse<EnhancedRecommendResponse>> recommendHybridEnhanced(
            @AuthenticationPrincipal UserPrincipal me,
            @RequestBody HybridRecommendRequest request,
            @RequestParam(required = false) List<Song.Level> difficulties,
            @RequestParam(required = false, defaultValue = "RECOMMEND_SCORE") FilterRequest.SortType sortBy,
            @RequestParam(required = false, defaultValue = "DESC") FilterRequest.SortOrder sortOrder,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size) {

        FilterRequest filter = FilterRequest.builder()
                .difficulties(difficulties)
                .sortBy(sortBy)
                .sortOrder(sortOrder)
                .page(page)
                .size(size)
                .build();

        Long userId = me.userId();
        EnhancedRecommendResponse data = recommendService.recommendHybridEnhanced(userId, request, filter);

        ApiResponse<EnhancedRecommendResponse> response = ApiResponse.success(
                200,
                "추천 결과를 성공적으로 조회했습니다.",
                data
        );

        return ResponseEntity.ok(response);
    }

    //추천 결과 필터링/정렬 API (프론트에서 별도 호출 용)

    @PostMapping("/filter")
    public ResponseEntity<ApiResponse<EnhancedRecommendResponse>> filterRecommendations(
            @RequestBody List<String> songIds,
            @RequestParam(required = false) List<Song.Level> difficulties,
            @RequestParam(required = false, defaultValue = "RECOMMEND_SCORE") FilterRequest.SortType sortBy,
            @RequestParam(required = false, defaultValue = "DESC") FilterRequest.SortOrder sortOrder,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "20") Integer size) {

        FilterRequest filter = FilterRequest.builder()
                .difficulties(difficulties)
                .sortBy(sortBy)
                .sortOrder(sortOrder)
                .page(page)
                .size(size)
                .build();

        EnhancedRecommendResponse data = recommendService.filterSongs(songIds, filter);

        ApiResponse<EnhancedRecommendResponse> response = ApiResponse.success(
                200,
                "필터링된 결과를 성공적으로 조회했습니다.",
                data
        );

        return ResponseEntity.ok(response);
    }
}

