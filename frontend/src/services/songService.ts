import { http } from "./http";
import type { SongDetailRes, SongDetail, LearningContent } from "@/types/song";

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

export type LearnedSongInfoRes = {
  status: number;
  message: string;
  data: {
    situation: string;
    location: string;
  };
};

export async function getLearnedSongInfo(
  learnedSongId: number,
  accessToken?: string
): Promise<{ situation: string; location: string }> {
  const response = await http.get<LearnedSongInfoRes>(
    `/user/${learnedSongId}/info`,
    {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    }
  );
  return response.data.data;
}

// accessToken은 로컬스토리지에서 꺼내오거나, 인터셉터를 쓰면 생략 가능
export async function createLearnedSong(
  payload: LearnedReq,
  accessToken?: string
) {
  // songId를 URL path에 포함
  const { data } = await http.post<LearnedRes>(
    `/songs/learned/${payload.songId}`,
    {
      situation: payload.situation || null,
      location: payload.location || null,
    },
    {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    }
  );
  return data.data; // learnedSongId 등을 돌려줌
}

export async function fetchSongDetail(
  songId: string,
  params: { situation?: string; location?: string } = {}
): Promise<SongDetail> {
  // POST 방식으로 body에 situation, location 전달
  const response = await http.post<SongDetailRes>(
    `/songs/${songId}`,
    {
      situation: params.situation || null,
      location: params.location || null,
    },
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  // ApiResponse wrapper에서 실제 데이터 추출
  return response.data.data;
}

export type ParsingResponse = {
  status: number;
  message: string;
  data: LearningContent;
};

export async function fetchLearningContent(
  songId: string,
  params: { situation?: string; location?: string } = {},
  accessToken?: string
): Promise<LearningContent> {
  const response = await http.post<ParsingResponse>(
    `/parsing/${songId}`,
    {
      situation: params.situation || null,
      location: params.location || null,
    },
    {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    }
  );
  return response.data.data;
}
