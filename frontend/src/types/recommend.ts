export type Difficulty = "LOW" | "MEDIUM" | "HIGH";

export type RecommendReq = {
  situation: string;
  location: string;
  limit: number;
};

export type Song = {
  songId: string;
  title: string;
  artists: string;
  albumName: string;
  albumImgUrl: string;
  level: Difficulty;
  durationMs: number;
  popularity: number;
  recommendScore: number;
  learnCount: number;
};

export type RecommendData = {
  recommendedSongs: Song[];
  keywords: {
    words: string[];
    phrases: string[];
  };
  totalCount: number;
};

// 서버 응답 스펙을 그대로 명시
export type RecommendRes = {
  status: number;   // 200
  message: string;  // "추천 결과를 성공적으로 조회했습니다."
  data: RecommendData;
};
