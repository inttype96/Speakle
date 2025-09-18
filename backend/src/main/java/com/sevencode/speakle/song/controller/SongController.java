package com.sevencode.speakle.song.controller;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.learn.dto.response.ApiResponse;
import com.sevencode.speakle.recommend.service.RecommendationSentenceService;
import com.sevencode.speakle.song.dto.request.SaveLearnedSongRequest;
import com.sevencode.speakle.song.dto.request.SongSearchRequest;
import com.sevencode.speakle.song.dto.response.SaveLearnedSongResponse;
import com.sevencode.speakle.song.dto.response.SongDetailResponse;
import com.sevencode.speakle.song.dto.response.SongResponse;
import com.sevencode.speakle.song.dto.response.SongRecommendationReasonResponse;
import com.sevencode.speakle.song.service.SongService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/songs")
@RequiredArgsConstructor
public class SongController {

    private final SongService songService;
    private final RecommendationSentenceService recommendationSentenceService;

    // 노래 리스트 (페이징) - GET 방식
    @GetMapping
    public ResponseEntity<ApiResponse<Page<SongResponse>>> getSongs(Pageable pageable) {
        Page<SongResponse> songs = songService.getSongs(pageable);
        ApiResponse<Page<SongResponse>> response = ApiResponse.success(
                200,
                "노래 리스트를 성공적으로 조회했습니다.",
                songs
        );
        return ResponseEntity.ok(response);
    }

    // 노래 검색 (POST 방식) - Request Body로 상세 검색
    @PostMapping("/search")
    public ResponseEntity<ApiResponse<Page<SongResponse>>> searchSongs(@RequestBody SongSearchRequest request) {
        Page<SongResponse> songs = songService.searchSongs(request);
        ApiResponse<Page<SongResponse>> response = ApiResponse.success(
                200,
                "노래 검색을 성공적으로 완료했습니다.",
                songs
        );
        return ResponseEntity.ok(response);
    }

    // 노래 상세 조회
    @GetMapping("/{songId}")
    public ResponseEntity<ApiResponse<SongDetailResponse>> getSongDetail(@PathVariable String songId) {
        SongDetailResponse songDetail = songService.getSongDetail(songId);
        ApiResponse<SongDetailResponse> response = ApiResponse.success(
                200,
                "노래 상세 정보를 성공적으로 조회했습니다.",
                songDetail
        );
        return ResponseEntity.ok(response);
    }

    /**
     * 수정(소연) - 학습곡 저장 API 추가
     * 사용자가 학습하고자 하는 곡을 선택했을 때 호출되는 엔드포인트
     * @param songId 학습할 곡의 ID (URL 경로에서 가져옴)
     * @param request 학습 상황 및 장소 정보
     * @param me 인증된 사용자 정보
     * @return 저장된 학습곡 정보
     */
    @PostMapping("/learned/{songId}")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SaveLearnedSongResponse>> saveLearnedSong(
            @PathVariable String songId,
            @RequestBody SaveLearnedSongRequest request,
            @AuthenticationPrincipal UserPrincipal me) {
        request.setSongId(songId);

        SaveLearnedSongResponse data = songService.saveLearnedSong(me.userId(), request);
        ApiResponse<SaveLearnedSongResponse> response = ApiResponse.success(
                200,
                "노래 학습 게임이 시작되었습니다.",
                data
        );
        return ResponseEntity.ok(response);
    }

    // 추천 이유 조회
    @GetMapping("/reason/{songId}")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<SongRecommendationReasonResponse>> getRecommendationReason(
            @PathVariable String songId,
            @AuthenticationPrincipal UserPrincipal me) {

        return recommendationSentenceService.getRecommendationReason(me.userId(), songId)
                .map(reason -> {
                    SongRecommendationReasonResponse data = SongRecommendationReasonResponse.builder()
                            .songId(songId)
                            .reasonSentence(reason.getReasonSentence())
                            .message("이 문장과 같은 '상황', '표현'에 사용할 수 있는 곡을 배울 수 있어요!")
                            .build();

                    ApiResponse<SongRecommendationReasonResponse> response = ApiResponse.success(
                            200,
                            "추천 이유를 성공적으로 조회했습니다.",
                            data
                    );
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    SongRecommendationReasonResponse data = SongRecommendationReasonResponse.builder()
                            .songId(songId)
                            .reasonSentence("추천 이유를 찾을 수 없습니다.")
                            .message("이 곡의 추천 이유가 아직 생성되지 않았습니다.")
                            .build();

                    ApiResponse<SongRecommendationReasonResponse> response = ApiResponse.success(
                            200,
                            "추천 이유가 없습니다.",
                            data
                    );
                    return ResponseEntity.ok(response);
                });
    }

//    //학습 노래 저장
//    @PostMapping("/learned")
//    public ResponseEntity<SaveLearnedSongResponse> saveLearnedSong(
//            @AuthenticationPrincipal UserPrincipal me,
//            @RequestBody SaveLearnedSongRequest request
//    ) {
//        SaveLearnedSongResponse response = songService.saveLearnedSong(me.userId(), request);
//        return ResponseEntity.ok(response);
//    }

}
