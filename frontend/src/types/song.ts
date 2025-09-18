export type LyricChunk = {
  id: string;
  startTimeMs: number;
  english: string;
  korean: string | null;
};

export type SongDetail = {
  songId: string;
  title: string;
  artists: string;
  album: string;
  albumImgUrl: string;
  popularity: number;
  durationMs: number;
  lyrics: string;          // 원본 전체 영어 가사 블록
  lyricChunks: LyricChunk[]; // 한 줄 단위 (영/한)
};

// 서버 응답은 ApiResponse로 감싸져 있음
export type SongDetailRes = {
  status: number;
  message: string;
  data: SongDetail;
};