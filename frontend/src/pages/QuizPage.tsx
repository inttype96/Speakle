// src/pages/QuizPage.tsx
/**
 * [QuizPage 개요]
 * - URL 쿼리파라미터(learned_song_id, song_id, situation, location, title, artist)를 읽는다.
 * - 백엔드에서 문제를 한 문제씩 가져오고(quizService.generateQuiz), 번역도 가져온다(또는 FE에서 번역 호출).
 * - 사용자가 답안을 입력해 제출하면 정오를 판단하고 토스트로 피드백을 준 뒤, 점수/결과를 저장하고 다음 문제로 이동한다.
 * - Skip 버튼은 오답 처리와 동일하지만 사용자 입력 없이 넘어간다.
 * - 상단에는 진행률, 중앙에는 문제 카드(포인트/타이머/난이도/문장/번역/입력), 하단에는 Skip/Next 버튼이 있다.
 *
 * [주의]
 * - Navbar가 position: fixed라면 본문 컨테이너에 pt-16/pt-20 같은 상단 여백을 주어야 가려지지 않는다(아래 코드 반영).
 * - Sonner 토스트를 쓰므로 App.tsx에 <Toaster />가 있어야 한다.
 */

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Navbar from "@/components/common/navbar";

// shadcn/ui
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// 아이콘
import { ChevronLeft, Timer, SkipForward } from "lucide-react";

// 서비스 & 타입
import {
  generateQuiz, marking, completeQuiz, normalizeToken,
} from "@/services/quizService";
import type { QuizGenerateRes, MarkingReq, CompleteRes } from "@/types/quiz";

// 우측 상단 표시(예시)
const TOP_RIGHT_SONG = "Blinding Lights - The Weeknd";
const TOP_RIGHT_MODE = "빈칸 퀴즈";

// 기본 파라미터
const DEFAULT_USER_ID = 4;
const DEFAULT_LEARNED_SONG_ID = 1;
const DEFAULT_SITUATION = "daily_conversation";
const DEFAULT_LOCATION = "cafe";
const DEFAULT_SONG_ID = 1;

// 총 문제 수(원하면 10으로 변경 가능)
const TOTAL_QUESTIONS = 3;
const POINTS_PER_Q = 100;

// ✅ learnedSongId별로 진행을 분리해 저장
const STORAGE_KEY = `quiz-progress:${DEFAULT_LEARNED_SONG_ID}`;

// ✅ 초기 qNum 결정: 1) URL ?q= → 2) localStorage → 3) 1
function getInitialQ(): number {
  const sp = new URLSearchParams(window.location.search);
  const fromUrl = Number(sp.get("q"));
  if (Number.isFinite(fromUrl) && fromUrl >= 1 && fromUrl <= TOTAL_QUESTIONS) {
    return fromUrl;
  }
  const saved = Number(localStorage.getItem(STORAGE_KEY));
  if (Number.isFinite(saved) && saved >= 1 && saved <= TOTAL_QUESTIONS) {
    return saved;
  }
  return 1;
}

// 00:00 형태로 시간(초)을 표시
const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

export default function QuizPage() {
  const lastFetchedQRef = useRef<number | null>(null);  
  // ✅ 새로고침 복원 대응
  const [qNum, setQNum] = useState<number>(getInitialQ());

  const [question, setQuestion] = useState<QuizGenerateRes["data"] | null>(null);
  const [userInput, setUserInput] = useState("");
  const [openResult, setOpenResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [complete, setComplete] = useState<CompleteRes["data"] | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // ✅ qNum 변경 → URL & localStorage 동기화
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(qNum));

    const sp = new URLSearchParams(window.location.search);
    sp.set("q", String(qNum));
    const newUrl = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [qNum]);

  // 문제 로드
  useEffect(() => {
    // 안전장치: 범위 보정
    if (qNum < 1 || qNum > TOTAL_QUESTIONS) {
      setQNum(1);
      return;
    }
    if (lastFetchedQRef.current === qNum) return; // ← 같은 qNum 중복 호출 방지
    lastFetchedQRef.current = qNum;
    (async () => {
      const res = await generateQuiz({
        learnedSongId: DEFAULT_LEARNED_SONG_ID,
        situation: DEFAULT_SITUATION,
        location: DEFAULT_LOCATION,
        songId: DEFAULT_SONG_ID,
        questionNumber: qNum,
      });
      setQuestion(res.data);
      setUserInput("");
      setIsCorrect(null);
      setOpenResult(false);
      setElapsed(0);
    })();
  }, [qNum]);

  // 타이머
  useEffect(() => {
    if (!question || complete) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [question, complete]);

  const answerTokens = useMemo(
    () => (question ? question.answer.map(normalizeToken) : []),
    [question]
  );

  const progressPct = Math.round(((qNum - 1) / TOTAL_QUESTIONS) * 100);
  const isLastQuestion = qNum >= TOTAL_QUESTIONS; // ✅ 마지막 문제 여부

  // 제출 → 정오판정 → 모달
  const onSubmitAnswer = useCallback(() => {
    if (!question) return;
    const userTokens = [normalizeToken(userInput)];
    const correct =
      userTokens.length === answerTokens.length &&
      userTokens.every((t, i) => t === answerTokens[i]);
    setIsCorrect(correct);
    setOpenResult(true);
  }, [answerTokens, question, userInput]);

  // 모달의 "다음 문제" → 결과 저장 + 다음 문제
  const onNextQuestion = useCallback(async () => {
    if (!question || isCorrect === null) return setOpenResult(false);

    const body: MarkingReq = {
      userId: DEFAULT_USER_ID,
      blankId: question.blankId,
      isCorrect,
      score: isCorrect ? POINTS_PER_Q : 0,
      originSentence: question.originSentence,
      question: question.question,
      correctAnswer: question.answer,
      userAnswer: [userInput],
    };
    await marking(body);
    setOpenResult(false);
    if (qNum < TOTAL_QUESTIONS) setQNum((n) => n + 1);
  }, [question, isCorrect, userInput, qNum]);

  // 마지막 문제에서 모달의 "퀴즈 종료" 누를 때: 마지막 답안 저장 + complete
  const finishFromModal = useCallback(async () => {
    if (!question || isCorrect === null) return setOpenResult(false);

    // 마지막 문제의 채점 결과도 저장
    const body: MarkingReq = {
      userId: DEFAULT_USER_ID,
      blankId: question.blankId,
      isCorrect,
      score: isCorrect ? POINTS_PER_Q : 0,
      originSentence: question.originSentence,
      question: question.question,
      correctAnswer: question.answer,
      userAnswer: [userInput],
    };
    await marking(body);

    // 퀴즈 종료(요약 데이터 수령)
    const res = await completeQuiz({ learnedSongId: DEFAULT_LEARNED_SONG_ID });
    setComplete(res.data);
    localStorage.removeItem(STORAGE_KEY);

    setOpenResult(false);
  }, [question, isCorrect, userInput]);

  // 스킵(오답으로 저장 후 다음)
  const onSkip = useCallback(async () => {
    if (!question) return;
    await marking({
      userId: DEFAULT_USER_ID,
      blankId: question.blankId,
      isCorrect: false,
      score: 0,
      originSentence: question.originSentence,
      question: question.question,
      correctAnswer: question.answer,
      userAnswer: [""],
    });
    if (qNum < TOTAL_QUESTIONS) setQNum((n) => n + 1);
  }, [question, qNum]);

  // 종료 (페이지 상단의 종료 버튼)
  const onComplete = useCallback(async () => {
    const res = await completeQuiz({ learnedSongId: DEFAULT_LEARNED_SONG_ID });
    setComplete(res.data);

    // ✅ 종료하면 진행 저장 삭제(다음 입장 시 1번부터 시작)
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const isCompleted = !!complete;

  return (
    <div className="bg-background text-foreground">
      {/* 1) 최상단 Navbar */}
      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />
      {/* 2) Navbar 아래 레이아웃 */}
      <div
        className="mx-auto max-w-none w-[var(--shell-w)] px-[var(--shell-gutter)]"
        style={{ paddingTop: "calc(var(--nav-h) + 8px)" }}
      >
        {/* 상단 행: 좌 뒤로가기 / 우 곡정보 박스 */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => history.back()}
            className="inline-flex items-center gap-2 text-[15px]"
          >
            <ChevronLeft size={18} />
            곡으로 돌아가기
          </button>

        <div className="rounded-md px-4 py-2.5 text-right">
            <div className="text-xs">{TOP_RIGHT_SONG}</div>
            <div className="text-sm font-semibold">{TOP_RIGHT_MODE}</div>
          </div>
        </div>

        {/* 진행 영역 */}
        <div className="mt-6 text-xs">
          Question {qNum} of {TOTAL_QUESTIONS}
        </div>
        <Progress value={progressPct} className="mt-2 h-2" />
        <div className="mt-1 text-right text-xs">
          {progressPct}% Complete
        </div>

        {/* 3) 본문: 문제 카드 + 입력 + 버튼 라인 */}
        {!isCompleted && (
          <div className="mx-auto mt-8 w-[min(980px,92vw)]">
            <Card className="border shadow-2xl">
              <CardHeader className="flex flex-col gap-4">
                {/* 상단 라벨: 포인트 / 타이머 / 난이도 */}
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className="rounded-full py-1 text-[12px]"
                  >
                    {POINTS_PER_Q} points
                  </Badge>

                  <div className="flex items-center gap-2 text-sm">
                    <Timer size={16} />
                    <span className="tabular-nums">{mmss(elapsed)}</span>
                  </div>

                  <Badge
                    variant="outline"
                    className="rounded-full py-1 text-[12px]"
                  >
                    Medium
                  </Badge>
                </div>

                <div className="font-bold">문제 {qNum}.</div>

                <CardTitle className="font-bold leading-relaxed text-[clamp(22px,2vw+12px,36px)]">
                  <span>
                    {question ? emphasizeBlank(question.question) : "—"}
                  </span>
                </CardTitle>

                <p className="text-[15px]">
                  {question?.korean ?? "문제를 불러오는 중..."}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* 입력 */}
                <div className="rounded-2xl border p-4">
                  <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="빈칸에 들어갈 단어를 입력하세요"
                    className="h-14 text-lg"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSubmitAnswer();
                    }}
                  />
                </div>

                {/* 버튼 라인: 좌 Skip / 우 Next + (종료) */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    className="h-10"
                    onClick={onSkip}
                  >
                    <SkipForward size={16} className="mr-2" />
                    Skip
                  </Button>

                  <div className="flex gap-2">
                    {/* <Button
                      variant="secondary"
                      className="h-10"
                      onClick={onComplete}
                    >
                      퀴즈 종료
                    </Button> */}
                    <Button
                      className="h-10 px-5"
                      onClick={onSubmitAnswer}
                    >
                      Next Question &rsaquo;
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="h-6" />
          </div>
        )}

        {/* 4) 종료 요약 */}
        {isCompleted && (
          <div className="mx-auto mt-10 w-[min(980px,92vw)]">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">퀴즈 결과 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  총 문제 {complete?.summary.totalQuestions}개 · 정답{" "}
                  {complete?.summary.correctAnswers}개 · 총점{" "}
                  {complete?.summary.totalScore}점
                </div>

                <div className="space-y-3">
                  {complete?.results.map((r) => (
                    <div
                      key={r.blankResultId}
                      className="rounded-xl border p-3 text-sm"
                    >
                      <div className="font-medium">
                        {r.meta.question}
                      </div>
                      <div className="mt-1">
                        <span>정답: </span>
                        {r.meta.correctAnswer.join(", ")}
                      </div>
                      <div>
                        <span>내 답: </span>
                        {r.meta.userAnswer.join(", ")}
                      </div>
                      <div className="mt-1">
                        결과:{" "}
                        <span
                          className={r.isCorrect ? "text-green-500" : "text-rose-500"}
                        >
                          {r.isCorrect ? "정답" : "오답"}
                        </span>{" "}
                        | 점수 {r.score}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Button onClick={() => (window.location.href = "/")}>홈으로</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 정답/오답 모달 */}
      <Dialog open={openResult} onOpenChange={setOpenResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCorrect ? "정답입니다! 🎉" : "오답입니다 😢"}</DialogTitle>
            <DialogDescription className="space-y-2">
              {question && (
                <>
                  <div><span>문제: </span>{question.question}</div>
                  <div><span>정답: </span>{question.answer.join(", ")}</div>
                  <div><span>내 답: </span>{userInput || "—"}</div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="secondary"
              onClick={() => setOpenResult(false)}
            >
              닫기
            </Button>

            {/* ✅ 마지막 문제면 '다음 문제' 숨기고 '퀴즈 종료'만 표시 */}
            {!isLastQuestion ? (
              <Button
                onClick={onNextQuestion}
                disabled={qNum >= TOTAL_QUESTIONS}
                title={qNum >= TOTAL_QUESTIONS ? "마지막 문제입니다. 종료를 눌러주세요." : ""}
              >
                다음 문제
              </Button>
            ) : (
              <Button onClick={finishFromModal}>
                퀴즈 종료
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** 연속 밑줄(_____) 강조 */
function emphasizeBlank(s: string) {
  return s.replace(/_{3,}/g, "__________");
}
