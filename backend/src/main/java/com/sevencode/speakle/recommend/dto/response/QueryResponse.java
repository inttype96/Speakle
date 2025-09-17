package com.sevencode.speakle.recommend.dto.response;

import com.sevencode.speakle.recommend.domain.Recommendation;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueryResponse {
    private List<Recommendation> results;
}
