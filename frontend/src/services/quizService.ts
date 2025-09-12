// src/services/quizService.ts
import { http } from "./http";
import type { QuizGenReq, QuizGenRes, SubmitScoreReq } from "@/types/quiz";

const USE_MOCK = true; // ← 실제 API 붙이면 false 로 변경

export async function generateQuiz(req: QuizGenReq): Promise<QuizGenRes> {
  if (USE_MOCK) {
    // 간단 목업 데이터
    const samples = [
      {
        full: "The club isn't the best place to find a lover.",
        blanked: "The club isn't the best place to find a ____.",
        answer: "lover",
      },
      {
        full: "I'm in love with the shape of you.",
        blanked: "I'm in love with the shape of ____.",
        answer: "you",
      },
      {
        full: "We talk for hours and hours about the sweet and the sour.",
        blanked: "We talk for hours and hours about the sweet and the ____.",
        answer: "sour",
      },
      {
        full: "Every day discovering something brand new.",
        blanked: "Every day discovering something brand ____.",
        answer: "new",
      },
      {
        full: "I'm in love with your body.",
        blanked: "I'm in love with your ____.",
        answer: "body",
      },
    ];
    const i = (req.questionNumber - 1) % samples.length;
    return Promise.resolve({
      questionNumber: req.questionNumber,
      fullSentence: samples[i].full,
      blankedSentence: samples[i].blanked,
      answerWord: samples[i].answer,
      blankId: 1000 + req.questionNumber,
    });
  }

  const res = await http.post("/learn/quiz/generate", req);
  return res.data as QuizGenRes;
}

export async function submitScore(req: SubmitScoreReq): Promise<void> {
  if (USE_MOCK) {
    // 목업: 아무 일도 안 함
    return Promise.resolve();
  }
  await http.post("/learn/quiz/submit", req);
}

/**
 * 번역 API (FE에서 호출)
 * 실제 엔드포인트/응답키에 맞게 수정하면 됨.
 */
export async function translateToKo(text: string): Promise<string> {
  if (USE_MOCK) {
    // 간단히 "(한글 번역) ..." 으로 표시만
    return Promise.resolve("(한글 번역) " + text);
  }
  const res = await http.get("/api/translate", {
    params: { q: text, source: "en", target: "ko" },
  });
  return res.data?.translatedText ?? "";
}
