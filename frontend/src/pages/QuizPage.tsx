// src/pages/QuizPage.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuizGenReq, QuizGenRes, SubmitScoreReq, QuizResultItem } from "@/types/quiz";
import * as quizService from "@/services/quizService";

const TOTAL_QUESTIONS = 5;

// 대소문자/공백/문장부호 무시 비교
const normalize = (s: string) =>
  s.toLowerCase().replace(/[\s\-\_\.,"'’!?]/g, "").trim();

export default function QuizPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  // 쿼리(없으면 기본값)
  const learned_song_id = Number(sp.get("learned_song_id") ?? 1);
  const song_id = Number(sp.get("song_id") ?? 1);
  const situation = sp.get("situation") ?? "date";
  const location = sp.get("location") ?? "club";

  const [currentNo, setCurrentNo] = useState(1);
  const [question, setQuestion] = useState<QuizGenRes | null>(null);
  const [translation, setTranslation] = useState("");
  const [userInput, setUserInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<QuizResultItem[]>([]);

  const progressPercent = useMemo(
    () => Math.round(((currentNo - 1) / TOTAL_QUESTIONS) * 100),
    [currentNo]
  );

  const fetchQuestion = useCallback(
    async (qNo: number) => {
      const req: QuizGenReq = {
        learned_song_id,
        song_id,
        situation,
        location,
        questionNumber: qNo,
      };
      const data = await quizService.generateQuiz(req);
      setQuestion(data);
      setUserInput("");
      const ko = await quizService.translateToKo(data.blankedSentence || data.fullSentence);
      setTranslation(ko);
    },
    [learned_song_id, song_id, situation, location]
  );

  useEffect(() => {
    fetchQuestion(1);
  }, [fetchQuestion]);

  const onSubmit = async () => {
    if (!question || submitting) return;
    setSubmitting(true);

    const isCorrect = normalize(userInput) === normalize(question.answerWord || "");
    const thisScore = isCorrect ? 10 : 0;
    setScore((prev) => prev + thisScore);

    setResults((prev) => [
      ...prev,
      {
        questionNumber: question.questionNumber,
        fullSentence: question.fullSentence,
        isCorrect,
        userInput,
        answerWord: question.answerWord,
      },
    ]);

    const payload: SubmitScoreReq = {
      userId: 0, // 로그인 붙이면 교체
      blankId: question.blankId,
      isCorrect,
      score: thisScore,
    };
    try {
      await quizService.submitScore(payload);
    } catch (e) {
      console.warn("submitScore failed", e);
    }

    if (currentNo >= TOTAL_QUESTIONS) {
      setSubmitting(false);
      // 간단 결과 알림 (원하면 별도 페이지/다이얼로그로 변경)
      alert(`퀴즈 종료! 점수: ${score + thisScore} / ${TOTAL_QUESTIONS * 10}`);
      // 예시: 목록으로 이동
      navigate(-1);
      return;
    }

    const next = currentNo + 1;
    setCurrentNo(next);
    setSubmitting(false);
    await fetchQuestion(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSubmit();
  };

  if (!question) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-2 w-full rounded-full bg-gray-200" />
        <div className="mt-8 text-center text-sm text-gray-500">문제를 불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* 상단 네비 */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <button className="hover:underline" onClick={() => navigate(-1)}>← 곡으로 돌아가기</button>
        <span className="mx-1">/</span>
        <span>빈칸 퀴즈</span>
      </div>

      {/* 진행률 */}
      <div className="mb-6">
        <div className="h-2 w-full rounded-full bg-violet-100">
          <div
            className="h-2 rounded-full bg-violet-300 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 text-right text-xs text-gray-500">
          {currentNo} / {TOTAL_QUESTIONS}
        </div>
      </div>

      {/* 문제 카드 */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 text-center text-lg font-semibold">문제 {currentNo}</div>

        <div className="mb-4 rounded-xl bg-violet-100/60 p-6 text-center text-[15px] leading-relaxed">
          {question.blankedSentence}
        </div>

        <div className="mb-6 rounded-xl bg-gray-100 p-4 text-center text-sm text-gray-600">
          {translation || "번역을 불러오는 중…"}
        </div>

        <div className="mb-4">
          <Label htmlFor="answer" className="sr-only">정답 입력</Label>
          <Input
            id="answer"
            placeholder="빈칸에 들어갈 단어를 입력하세요"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <p className="mt-2 text-xs text-gray-500">대소문자/띄어쓰기는 자동으로 무시됩니다.</p>
        </div>

        <div className="mt-6 flex justify-center">
          <Button onClick={onSubmit} disabled={submitting || !userInput.trim()}>
            {submitting ? "제출 중…" : "답안 제출"}
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-6 text-center text-sm text-gray-500">
        현재 점수: {score} / {10 * (currentNo - 1)}
      </div>
    </div>
  );
}
