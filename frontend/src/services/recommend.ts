import { http } from "./http";
import type { RecommendReq, RecommendRes, RecommendData, RandomSongRes } from "@/types/recommend";

export async function fetchRecommendations(params: RecommendReq): Promise<RecommendData> {
  const res = await http.post<RecommendRes>("/recommend/hybrid/enhanced", params, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data.data; // { recommendedSongs, keywords, totalCount }
}

export async function fetchRandomSong(): Promise<string> {
  const res = await http.get<RandomSongRes>("/recommend/random");
  return res.data.data.songId;
}
