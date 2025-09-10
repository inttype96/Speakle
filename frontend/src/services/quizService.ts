/**
 * 퀴즈 도메인의 API 호출 모음
 * - pages/components에서는 비즈니스 의미가 담긴 함수만 사용하게 하여 의존성 감소
 */
import { http } from "./http";
import type {
  QuizGenReq,
  QuizGenRes,
  SubmitScoreReq,
  QuizSummaryRes,
} from "@/types/quiz";

/** 문제 생성 요청 */
export const createQuiz = (req: QuizGenReq) =>
  http.post<QuizGenRes>("/api/learn/quiz/generate", req).then((r) => r.data);

/** 점수(정/오답) 제출 */
export const submitScore = (req: SubmitScoreReq) =>
  http.post<void>("/api/learn/quiz/submit", req).then((r) => r.data);

/** 퀴즈 결과 요약 조회 (문항별 정오답/총점 등) */
export const fetchSummary = (learned_song_id: number) =>
  http
    .get<QuizSummaryRes>("/api/learn/quiz/summary", { params: { learned_song_id } })
    .then((r) => r.data);
