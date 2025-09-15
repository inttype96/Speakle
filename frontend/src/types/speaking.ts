// src/types/speaking.ts
export type SpeakingEvalReq = {
  learnedSongId: number;
  questionNumber: number;
};

export type SpeakingEvalResData = {
  speakingId: number;
  learnedSongId: number;
  songId: number;
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
  audioBase64: string;  // 파일 BASE64 (dataURL prefix 제거한 순수 base64)
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
