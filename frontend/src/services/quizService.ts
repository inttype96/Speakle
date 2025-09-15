// src/services/quizService.ts
// ──────────────────────────────────────────────────────────────────────────────
// [역할]
// - 빈칸퀴즈 관련 API 호출 래퍼
// - USE_MOCK = true 일 때는 네트워크 없이 목업 데이터로 동작
// - 실제 API 붙일 땐 USE_MOCK = false 로 변경
// ──────────────────────────────────────────────────────────────────────────────

import { http } from "./http"; // 공용 axios 인스턴스 (baseURL, interceptors 등)
import type {
  QuizGenerateReq,
  QuizGenerateRes,
  MarkingReq,
  MarkingRes,
  CompleteReq,
  CompleteRes,
} from "@/types/quiz";

// 실제 API 연결 전까지는 목업으로 프론트만 돌릴 수 있게 플래그 제공
const USE_MOCK = false;

// ──────────────────────────────────────────────────────────────────────────────
// 유틸: 문자열 정규화 (공백/대소문자 등)
// - " Lover  " → "lover"
// - 다중 단어/다중 빈칸 케이스 대비 배열 비교를 용이하게 만들 수 있음
// ──────────────────────────────────────────────────────────────────────────────
export function normalizeToken(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

// ──────────────────────────────────────────────────────────────────────────────
// 목업 데이터 (문항 3개 예시)
// ──────────────────────────────────────────────────────────────────────────────
const MOCK_QUESTIONS: Array<QuizGenerateRes["data"]> = [
  {
    blankId: 1001,
    learnedSongId: 12345,
    songId: 123,
    recommendationSentenceId: 9001,
    originSentence: "The club isn't the best place to find a lover",
    korean: "클럽은 연인을 찾기에 최적의 장소가 아닙니다",
    question: "The club isn't the best place to find a _____",
    answer: ["lover"],
    createdAt: "2024-09-08T10:30:00Z",
  },
  {
    blankId: 1002,
    learnedSongId: 12345,
    songId: 123,
    recommendationSentenceId: 9002,
    originSentence: "I have this thing where I get older but just never wiser",
    korean: "나는 나이가 들어가지만 결코 현명해지지 않는다는 문제가 있어요",
    question: "I have this thing where I get older but just never _____",
    answer: ["wiser"],
    createdAt: "2024-09-08T10:31:00Z",
  },
  {
    blankId: 1003,
    learnedSongId: 12345,
    songId: 123,
    recommendationSentenceId: 9003,
    originSentence: "Life is what happens when you're busy making other plans",
    korean: "인생은 당신이 다른 계획을 세우느라 바쁠 때 일어나는 것입니다",
    question: "Life is what happens when you're busy making other _____",
    answer: ["plans"],
    createdAt: "2024-09-08T10:32:00Z",
  },
];

let MOCK_RESULT_ID = 5000;

// ──────────────────────────────────────────────────────────────────────────────
// 1) 퀴즈 생성
// ──────────────────────────────────────────────────────────────────────────────
export async function generateQuiz(req: QuizGenerateReq): Promise<QuizGenerateRes> {
  if (USE_MOCK) {
    // questionNumber에 따라 목업 반환
    const idx = Math.max(0, req.questionNumber - 1);
    const data = MOCK_QUESTIONS[idx % MOCK_QUESTIONS.length];
    return {
      status: 200,
      message: "빈칸 퀴즈가 성공적으로 생성되었습니다. [mock]",
      data,
    };
  }

  const res = await http.post<QuizGenerateRes>("/api/learn/quiz/generate", req, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}

// ──────────────────────────────────────────────────────────────────────────────
// 2) 채점 저장 (marking)
// - "다음 문제"를 누를 때 호출 (정답/오답 모달 확인 후)
// ──────────────────────────────────────────────────────────────────────────────
export async function marking(body: MarkingReq): Promise<MarkingRes> {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    return {
      status: 200,
      message: "퀴즈 결과가 저장되었습니다. [mock]",
      data: {
        blankResultId: ++MOCK_RESULT_ID,
        userId: body.userId,
        blankId: body.blankId,
        isCorrect: body.isCorrect,
        score: body.score,
        createdAt: now,
        meta: {
          originSentence: body.originSentence,
          question: body.question,
          correctAnswer: body.correctAnswer,
          userAnswer: body.userAnswer,
        },
      },
    };
  }

  const res = await http.post<MarkingRes>("/api/learn/quiz/marking", body, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}

// ──────────────────────────────────────────────────────────────────────────────
// 3) 퀴즈 종료(complete)
// - 스펙은 GET + Body 이지만 일반적으로는 params 로 보내는 것을 권장
// - 여기서는 axios.request 로 data도 시도한 뒤, 실패 시 params 로 폴백 가능
// - Authorization 헤더 필요: Bearer {token}
// ──────────────────────────────────────────────────────────────────────────────
export async function completeQuiz(
  body: CompleteReq,
  accessToken?: string
): Promise<CompleteRes> {
  if (USE_MOCK) {
    // 간단 합산: 정답 2개, 총점 20
    return {
      status: 200,
      message: "퀴즈가 완료되었습니다. [mock]",
      data: {
        summary: {
          totalQuestions: 3,
          correctAnswers: 2,
          totalScore: 20,
        },
        results: [
          {
            blankResultId: 5001,
            userId: 101,
            blankId: 1,
            isCorrect: true,
            score: 10,
            createdAt: "2025-09-08T12:30:00Z",
            meta: {
              originSentence:
                "I have this thing where I get older but just never wiser",
              question:
                "I have this thing where I get older but just never _____",
              correctAnswer: ["wiser"],
              userAnswer: ["wiser"],
            },
          },
          {
            blankResultId: 5002,
            userId: 101,
            blankId: 2,
            isCorrect: false,
            score: 0,
            createdAt: "2025-09-08T12:31:00Z",
            meta: {
              originSentence:
                "The best way to find out if you can trust somebody is to trust them",
              question:
                "The best way to find out if you can _____ somebody is to trust them",
              correctAnswer: ["trust"],
              userAnswer: ["believe"],
            },
          },
          {
            blankResultId: 5003,
            userId: 101,
            blankId: 3,
            isCorrect: true,
            score: 10,
            createdAt: "2025-09-08T12:32:00Z",
            meta: {
              originSentence:
                "Life is what happens when you're busy making other plans",
              question:
                "Life is what happens when you're busy making other _____",
              correctAnswer: ["plans"],
              userAnswer: ["plans"],
            },
          },
        ],
      },
    };
  }

  // 우선 body 포함 시도
  try {
    const res = await http.request<CompleteRes>({
      method: "GET",
      url: "/api/learn/quiz/complete",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      data: body, // 일부 서버/프록시는 GET body를 무시할 수 있음
    });
    return res.data;
  } catch {
    // 실패 시 params로 재시도 (권장 방식)
    const res2 = await http.get<CompleteRes>("/api/learn/quiz/complete", {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      params: { learnedSongId: body.learnedSongId },
    });
    return res2.data;
  }
}
