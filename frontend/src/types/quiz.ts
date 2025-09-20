// src/types/quiz.ts
// ──────────────────────────────────────────────────────────────────────────────
// [역할]
// - 백엔드 API 명세에 맞춘 타입 모음
// - 프론트 내 데이터 안전성 확보 + 자동 완성 도움
// ──────────────────────────────────────────────────────────────────────────────

export type QuizGenerateReq = {
  learnedSongId: number;
  situation: string;     // 예: "daily_conversation"
  location: string;      // 예: "cafe"
  songId: string;        // 문자열 ID (예: "2gFvRmQiWg9fN9i74Q0aiw")
  questionNumber: number; // 1..N (현재 1개 빈칸 기준)
};

export type QuizGenerateResData = {
  blankId: number;
  learnedSongId: number;
  songId: number;
  title: string;          // "shape of you"
  artists: string;        // "Ed Sheeran"
  recommendationSentenceId: number;
  originSentence: string;
  korean: string;
  question: string;       // "The club isn't the best place to find a _____"
  answer: string[];       // ["lover"]  ← 다중 빈칸 확장 여지를 위해 배열
  createdAt: string;      // ISO
};

export type QuizGenerateRes = {
  status: number;
  message: string;
  data: QuizGenerateResData;
};

export type MarkingReq = {
  userId: number;
  blankId: number;
  isCorrect: boolean;
  score: number;         // 예: 정답 10, 오답 0
  originSentence: string;
  question: string;
  correctAnswer: string[]; // ["wiser"]
  userAnswer: string[];    // ["friend"]
};

export type MarkingResData = {
  blankResultId: number;
  userId: number;
  blankId: number;
  isCorrect: boolean;
  score: number;
  createdAt: string;
  meta: {
    originSentence: string;
    question: string;
    correctAnswer: string[];
    userAnswer: string[];
  };
};

export type MarkingRes = {
  status: number;
  message: string;
  data: MarkingResData;
};

// ──────────────────────────────────────────────────────────────────────────────
// [주의] 스펙은 GET + Body 이지만, 일반적으로 GET은 body를 사용하지 않습니다.
// - axios로는 params로 우회하거나, backend가 진짜 body-GET을 받도록 해야 합니다.
// 여기서는 서비스단에서 두 방식 모두 시도할 수 있게 코드를 작성합니다.
// ──────────────────────────────────────────────────────────────────────────────
export type CompleteReq = {
  learnedSongId: number;
};

export type CompleteResultItem = {
  blankResultId: number;
  userId: number;
  blankId: number;
  isCorrect: boolean;
  score: number;
  createdAt: string;
  meta: {
    originSentence: string;
    question: string;
    correctAnswer: string[];
    userAnswer: string[];
  };
};

export type CompleteResData = {
  summary: {
    totalQuestions: number;
    correctAnswers: number;
    totalScore: number;
  };
  results: CompleteResultItem[];
};

export type CompleteRes = {
  status: number;
  message: string;
  data: CompleteResData;
};
