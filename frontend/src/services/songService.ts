import { http } from "./http";
import type { SongDetailRes, SongDetail } from "@/types/song";

export type LearnedReq = {
  songId: string;
  situation?: string;
  location?: string;
};

export type LearnedRes = {
  status: number;
  message: string;
  data: {
    learnedSongId: number;
    songId: string;
    situation: string;
    location: string;
  };
};

// accessToken은 로컬스토리지에서 꺼내오거나, 인터셉터를 쓰면 생략 가능
export async function createLearnedSong(
  payload: LearnedReq,
  accessToken?: string
) {
  const { data } = await http.post<LearnedRes>("/songs/learned", payload, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  return data.data; // learnedSongId 등을 돌려줌
}

export async function fetchSongDetail(
  songId: string,
  params: { situation?: string; location?: string } = {}
): Promise<SongDetail> {
  const { data } = await http.get<SongDetailRes>(`/songs/${songId}`, {
    params, // ✅ GET 쿼리로 전달
    headers: { "Content-Type": "application/json" },
  });
  return data;
}
