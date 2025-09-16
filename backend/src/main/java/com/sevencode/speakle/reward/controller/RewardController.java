package com.sevencode.speakle.reward.controller;

import com.sevencode.speakle.config.security.UserPrincipal;
import com.sevencode.speakle.learn.dto.response.ApiResponse;
import com.sevencode.speakle.reward.dto.request.RewardUpdateRequest;
import com.sevencode.speakle.reward.dto.response.RewardUpdateResponse;
import com.sevencode.speakle.reward.service.RewardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reward")
public class RewardController {
    private final RewardService rewardService;

    /**
     * 포인트 업데이트
     */
    @PostMapping("/update")
    public ResponseEntity<ApiResponse<RewardUpdateResponse>> updateReward(@Valid @RequestBody RewardUpdateRequest request,
                                                                          @AuthenticationPrincipal UserPrincipal me) {
        Long userId = me.userId();
        RewardUpdateResponse response = rewardService.updateReward(request, userId);

        return ResponseEntity.ok(ApiResponse.success(200, "포인트를 업데이트 했습니다.", response));
    }
}
