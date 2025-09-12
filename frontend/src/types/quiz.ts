// src/types/quiz.ts
export type QuizGenReq = {
  learned_song_id: number;
  situation: string;
  location: string;
  song_id: number;
  questionNumber: number; // 1..N
};

export type QuizGenRes = {
  questionNumber: number;
  fullSentence: string;     // 정답 문장 (원문)
  blankedSentence: string;  // 빈칸이 뚫린 문장
  answerWord: string;       // 정답 단어/구
  blankId: number;          // 저장용 ID
};

export type SubmitScoreReq = {
  userId: number;  // 로그인 연동 전이면 0 등 임시 값
  blankId: number;
  isCorrect: boolean;
  score: number;   // 정답 10 / 오답 0 등
};

export type QuizResultItem = {
  questionNumber: number;
  fullSentence: string;
  isCorrect: boolean;
  userInput?: string;
  answerWord: string;
};
