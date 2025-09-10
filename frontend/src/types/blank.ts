/** 빈칸퀴즈와 관련된 타입 정의 모음
 * 서비스 / 페이지 전역에서 공통으로 사용하는 req, res, dto 타입
 * 백엔드 엔티티의 데이터 스키마가 바뀌면 여기를 수정
 */ 

export type QuizGenReq = {
  learnedSongId: number; // <- 사용자가 학습했던 곡 ID
  situation: string; // 상황  키워드
  location: string; // 장소 키워드
  song_id: number; // 곡 고유 ID
  questionNumber: number; // 현재 문제 번호 ( 1.. N)
};

export type QuizGenRes = {
  questionNumber: number; // 요청한 문제 번호
  fullSentence: string;     // 정답문장
  blankedSentence: string;  // 빈칸이 뚫린 문장
  answerWord: string;       // 정답단어 (단어/구)
  blankId: number;          // 백엔드 DB에 저장된 blank 식별자
};

// 채점 및 점수 제출
export type SubmitScoreReq = {
  userId: number; // 사용자 식별자
  blankId: number; // 문제 식별자
  isCorrect: boolean; // 정, 오답 여부
  score: number; // 정답이면 10, 오답이면 0
};

// 결과 요약 및 정리
export type QuizResultItem = {
  questionNumber: number; // 문제 번호
  fullSentence: string; // 정답 문장
  isCorrect: boolean; // 맞췄는지 여부
  userInput?: string; // 사용자가 실제 입력한 답
  answerWord: string; // 실제 정답 단어
};

export type QuizSummaryRes = {
  items: QuizResultItem[]; // 문제별 상세 결과 리스트
  totalScore: number; // 총점
  correctCount: number; // 맞춘 문제 개수
};
