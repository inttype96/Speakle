export type LyricChunk = {
  id: string;
  startTimeMs: number;
  english: string;
  korean: string | null;
};

export type WordEntity = {
  id: number;
  songId: string;
  situation: string;
  location: string;
  word: string;
  phonetic?: string;
  meaning: string;
  pos?: string;
  examples?: string[];
  level: string;
  tags?: string[];
  createdAt: string;
};

export type SentenceEntity = {
  id: number;
  songId: string;
  situation: string;
  location: string;
  sentence: string;
  meaning: string;
  translation?: string;
  pattern?: string;
  examples?: string[];
  level: string;
  tags?: string[];
  createdAt: string;
};

export type ExpressionEntity = {
  id: number;
  songId: string;
  situation: string;
  location: string;
  expression: string;
  meaning: string;
  usage?: string;
  examples?: string[];
  level: string;
  tags?: string[];
  createdAt: string;
};

export type IdiomEntity = {
  id: number;
  songId: string;
  situation: string;
  location: string;
  idiom: string;
  meaning: string;
  origin?: string;
  examples?: string[];
  level: string;
  tags?: string[];
  createdAt: string;
};

export type LearningContent = {
  words: WordEntity[];
  sentences: SentenceEntity[];
  expressions: ExpressionEntity[];
  idioms: IdiomEntity[];
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
  learningContent?: LearningContent; // 학습 내용
};

// 서버 응답은 ApiResponse로 감싸져 있음
export type SongDetailRes = {
  status: number;
  message: string;
  data: SongDetail;
};