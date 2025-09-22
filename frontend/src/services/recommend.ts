import { http } from "./http";
import type { RecommendReq, RecommendRes, RecommendData } from "@/types/recommend";

export async function fetchRecommendations(params: RecommendReq): Promise<RecommendData> {
  const res = await http.post<RecommendRes>("/recommend/hybrid/enhanced", params, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data.data; // { recommendedSongs, keywords, totalCount }
}
