// src/types/speaking.ts
export type SpeakingEvalReq = {
  learnedSongId: number;
  situation: string;
  location: string;
  songId: string;        // 문자열 ID
  questionNumber: number;
};

export type SpeakingEvalResData = {
  speakingId: number;
  learnedSongId: number;
  songId: string;        // 문자열 ID로 변경
  title: string;
  artists: string;
  coreSentence: string;
};

export type SpeakingEvalRes = {
  status: number;
  message: string;
  data: SpeakingEvalResData;
};

export type SpeakingSubmitReq = {
  speakingId: number;
  script: string;       // 코어 문장
  audio?: string;        // base64 (dataURL prefix 제거)
  audioBase64?: string;  // 둘 중 하나만 있어도 됨
};

export type SpeakingSubmitResData = {
  speakingResultId: number;
  speakingId: number;
  isCorrect: boolean;
  score: number;
  createdAt: string;
  meta: {
    origin_sentence: string;
    recognized: string;
    score: string; // 서버가 문자열로 주는 float
  };
};

export type SpeakingSubmitRes = {
  status: number;
  message: string;
  data: SpeakingSubmitResData;
};
