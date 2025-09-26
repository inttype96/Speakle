export type DictationStartReq = {
    learnedSongId: number;
    questionNumber: number; // 1..3
  };
  
  export type DictationItem = {
    dictationId: number;
    questionNumber: number;
    learnedSongId: number;
    songId: string;
    title: string;
    artists: string;
    coreSentence: string;
    korean: string;
    startTime: number;
    duration: number;
    endTime: number;
    createdAt: string;
  };
  
  export type DictationStartRes = {
    status: number;
    message: string;
    data: DictationItem;
  };
  
  export type DictationMarkingReq = {
    userId: number;
    dictationId: number;
    isCorrect: boolean;
    score: number;
    meta: {
      userAnswer: string;
      correctAnswer: string;
    };
  };
  
  export type DictationMarkingRes = {
    status: number;
    message: string;
    data: {
      dictationResultId: number;
      userId: number;
      dictationId: number;
      isCorrect: boolean;
      score: number;
      createdAt: string;
      meta: {
        userAnswer: string;
        correctAnswer: string;
      };
    };
  };
  
  export type DictationCompleteRes = {
    status: number;
    message: string;
    data: {
      summary: { totalQuestions: number; correctAnswers: number; totalScore: number };
      results: Array<{
        dictationResultId: number;
        userId: number;
        dictationId: number;
        isCorrect: boolean;
        score: number;
        createdAt: string;
        meta: { userAnswer: string; correctAnswer: string };
      }>;
    };
  };