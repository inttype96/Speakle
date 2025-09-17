package com.sevencode.speakle.song.controller;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.song.dto.request.SaveLearnedSongRequest;
import com.sevencode.speakle.song.dto.response.SaveLearnedSongResponse;
import com.sevencode.speakle.song.dto.response.SongDetailResponse;
import com.sevencode.speakle.song.dto.response.SongResponse;
import com.sevencode.speakle.song.service.SongService;
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

    // 노래 리스트 (페이징)
    @GetMapping
    public ResponseEntity<Page<SongResponse>> getSongs(Pageable pageable) {
        return ResponseEntity.ok(songService.getSongs(pageable));
    }

    // 노래 상세 조회
    @GetMapping("/{songId}")
    public ResponseEntity<SongDetailResponse> getSongDetail(@PathVariable String songId) {
        return ResponseEntity.ok(songService.getSongDetail(songId));
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
