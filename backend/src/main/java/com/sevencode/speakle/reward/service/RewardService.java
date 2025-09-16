package com.sevencode.speakle.reward.service;

import com.sevencode.speakle.reward.dto.request.RewardUpdateRequest;
import com.sevencode.speakle.reward.dto.response.RewardProfileResponse;
import com.sevencode.speakle.reward.dto.response.RewardUpdateResponse;
import jakarta.validation.Valid;

public interface RewardService {
    RewardUpdateResponse updateReward(@Valid RewardUpdateRequest request, Long userId);
    RewardProfileResponse getPointProfile(Long userId);
}
