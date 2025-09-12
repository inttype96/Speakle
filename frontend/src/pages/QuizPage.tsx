// src/pages/QuizPage.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import Navbar from "@/components/common/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import type {
  QuizGenReq,
  QuizGenRes,
  SubmitScoreReq,
  QuizResultItem,
} from "@/types/quiz";
import * as quizService from "@/services/quizService";

const TOTAL_QUESTIONS = 5;

// 대소문자/공백/문장부호 무시 비교
const normalize = (s: string) =>
  s.toLowerCase().replace(/[\s\-_\.,"'’!?]/g, "").trim();

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

      const ko = await quizService.translateToKo(
        data.blankedSentence || data.fullSentence
      );
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

    const isCorrect =
      normalize(userInput) === normalize(question.answerWord || "");
    const thisScore = isCorrect ? 10 : 0;

    // ✅ Sonner 토스트
    if (isCorrect) {
      toast.success("정답!", { description: "좋아요! 다음 문제로 가요." });
    } else {
      toast.error("아쉬워요", {
        description: `정답: ${question.answerWord}`,
      });
    }

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

    // 정답여부 저장(실패해도 UX 계속)
    const payload: SubmitScoreReq = {
      userId: 0, // TODO: 로그인 붙이면 실제 사용자 ID로 교체
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
      toast("퀴즈 종료!", {
        description: `최종 점수: ${score + thisScore} / ${TOTAL_QUESTIONS * 10}`,
      });
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

  // 로딩 상태 (간단 버전)
  if (!question) {
    return (
      <div className="bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
          <Progress value={0} className="h-2" />
          <Card className="p-6">
            <div className="space-y-3">
              <div className="h-6 w-24 rounded bg-muted animate-pulse" />
              <div className="h-16 w-full rounded bg-muted animate-pulse" />
              <div className="h-10 w-full rounded bg-muted animate-pulse" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      {/* NOTE: Navbar가 fixed면 본문에 pt-16/pt-20로 여백을 주세요 */}
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 pt-16 md:pt-20">
        {/* 상단 보조 네비 */}
        <Breadcrumb className="mb-3 text-sm">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => navigate(-1)}
                className="cursor-pointer"
              >
                ← 곡으로 돌아가기
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>빈칸 퀴즈</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 진행률 */}
        <div className="mb-4">
          <Progress value={progressPercent} className="h-2" />
          <div className="mt-2 text-right text-xs text-muted-foreground">
            {currentNo} / {TOTAL_QUESTIONS}
          </div>
        </div>

        {/* 문제 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">문제 {currentNo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-violet-100/60 p-6 text-center text-[15px] leading-relaxed">
              {question.blankedSentence}
            </div>

            {/* 번역 표시 */}
            <Alert>
              <AlertTitle>한글 번역</AlertTitle>
              <AlertDescription>
                {translation || "번역을 불러오는 중…"}
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="answer" className="sr-only">
                정답 입력
              </Label>
              <Input
                id="answer"
                placeholder="빈칸에 들어갈 단어를 입력하세요"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                대소문자/띄어쓰기는 자동으로 무시됩니다.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <Button onClick={onSubmit} disabled={submitting || !userInput.trim()}>
                {submitting ? "제출 중…" : "답안 제출"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto mt-6 text-center text-sm text-muted-foreground">
          현재 점수: {score} / {10 * (currentNo - 1)}
        </div>
      </div>
    </div>
  );
}
