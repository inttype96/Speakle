package com.sevencode.speakle.learn.controller;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.learn.dto.response.ApiResponse;
import com.sevencode.speakle.learn.dto.response.LearnedSongInfoResponse;
import com.sevencode.speakle.learn.dto.response.RecentLearnedSongsResponse;
import com.sevencode.speakle.learn.dto.response.RecentLearnedSongsVersion2Response;
import com.sevencode.speakle.learn.service.LearnedSongService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class RecentLearnedController {

    private final LearnedSongService learnedSongService;

    /**
     * 최근 학습한 곡 목록 조회
     */
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<RecentLearnedSongsResponse>> getRecentLearnedSongs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int size,
            @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me.userId();

        RecentLearnedSongsResponse res = learnedSongService.getRecentLearnedSongs(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(200, "최근 학습한 노래 목록을 성공적으로 조회했습니다.", res));
    }

//    @GetMapping("/recent/v2")
//    public ResponseEntity<ApiResponse<RecentLearnedSongsVersion2Response>> getRecentLearnedSongsVersion2(
//            @RequestParam(defaultValue = "1") int page,
//            @RequestParam(defaultValue = "5") int size,
//            @AuthenticationPrincipal UserPrincipal me) {
//        Long userId = me.userId();
//
//        RecentLearnedSongsVersion2Response res = learnedSongService.getRecentLearnedSongsVersion2(userId, page, size);
//        return ResponseEntity.ok(ApiResponse.success(200, "최근 학습한 노래 목록을 성공적으로 조회했습니다.", res));
//    }

    @GetMapping("/{learnedSongId}/info")
    public ResponseEntity<ApiResponse<LearnedSongInfoResponse>> getSituationAndLocation(
            @PathVariable Long learnedSongId) {

        LearnedSongInfoResponse res = learnedSongService.getSituationAndLocation(learnedSongId);

        return ResponseEntity.ok(ApiResponse.success(200, "최근 학습한 노래 정보를 성공적으로 조회했습니다.", res));
    }
}
