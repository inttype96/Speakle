// src/pages/QuizPage.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/common/navbar";

// shadcn/ui
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// icons
import { ChevronLeft, Timer, SkipForward } from "lucide-react";

// 서비스 & 타입
import {
  generateQuiz,
  marking,
  completeQuiz,
  normalizeToken,
} from "@/services/quizService";
import type { QuizGenerateRes, MarkingReq, CompleteRes } from "@/types/quiz";
import { useAuthStore } from "@/store/auth";

const TOP_RIGHT_MODE = "빈칸 퀴즈";
const DEFAULT_LEARNED_SONG_ID = 1;
const DEFAULT_SITUATION = "daily_conversation";
const DEFAULT_LOCATION = "cafe";
const DEFAULT_SONG_ID = "1";

const TOTAL_QUESTIONS = 3;
const POINTS_PER_Q = 5; // 문제당 만점 5점

function getInitialQ(search: string, storageKey: string): number {
  const sp = new URLSearchParams(search);
  const fromUrl = Number(sp.get("q"));
  if (Number.isFinite(fromUrl) && fromUrl >= 1 && fromUrl <= TOTAL_QUESTIONS) {
    return fromUrl;
  }
  const saved = Number(localStorage.getItem(storageKey));
  if (Number.isFinite(saved) && saved >= 1 && saved <= TOTAL_QUESTIONS) {
    return saved;
  }
  return 1;
}

const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

// 빈칸을 정답 단어 길이에 맞는 언더바로 변환하는 함수
const formatQuestionWithBlanks = (question: string, correctAnswers: string[]): string => {
  let result = question;
  let answerIndex = 0;
  
  // "빈칸"을 정답 단어 길이에 맞는 언더바로 교체
  result = result.replace(/빈칸/g, () => {
    if (answerIndex < correctAnswers.length) {
      const answer = correctAnswers[answerIndex];
      const underscores = "_".repeat(Math.max(answer.length, 3)); // 최소 3글자
      answerIndex++;
      return underscores;
    }
    return "___"; // fallback
  });
  
  return result;
};

/** ──────────────────────────────────────────────────────────────
 * 문장 내 '빈칸' 토큰 사이사이에 인라인 입력칸을 삽입하는 컴포넌트
 * props:
 *  - question: "The 빈칸 isn't the best place to find a 빈칸"
 *  - inputs: ["", ""]  // 사용자 입력 상태
 *  - setInputs: (idx, value) -> void
 *  - onEnterLast?: 마지막 칸에서 Enter 입력 시 실행
 ───────────────────────────────────────────────────────────────*/
function InlineBlankInputs({
  question,
  inputs,
  setInputs,
  onEnterLast,
}: {
  question: string;
  inputs: string[];
  setInputs: (idx: number, v: string) => void;
  onEnterLast?: () => void;
}) {
  // '빈칸' 기준으로 분리
  const parts = useMemo(() => question.split(/빈칸/g), [question]);
  return (
    <span className="leading-relaxed flex flex-wrap items-baseline gap-2">
      {parts.map((chunk, i) => {
        const isLastText = i === parts.length - 1;
        const hasInputHere = i < parts.length - 1; // 마지막 조각 전까지는 입력칸이 옴
        return (
          <span key={i} className="flex items-baseline gap-2">
            {chunk && <span>{chunk}</span>}
            {hasInputHere && (
              <input
                value={inputs[i] ?? ""}
                onChange={(e) => setInputs(i, e.target.value)}
                onKeyDown={(e) => {
                  const lastIdx = inputs.length - 1;
                  if (e.key === "Enter" && i === lastIdx && onEnterLast) {
                    onEnterLast();
                  }
                }}
                className="h-10 min-w-[96px] px-3 rounded-xl border bg-background/60 shadow-inner
                           outline-none focus:ring-2 focus:ring-violet-500 text-[18px]"
                placeholder="정답"
              />
            )}
            {isLastText && null}
          </span>
        );
      })}
    </span>
  );
}

export default function QuizPage() {
  const [sp] = useSearchParams();
  const { userId } = useAuthStore();

  const { learnedSongId, songId, situation, location } = useMemo(() => {
    const lsid = Number(sp.get("learnedSongId"));
    const rawSongId = sp.get("songId");

    const result = {
      learnedSongId: Number.isFinite(lsid) ? lsid : DEFAULT_LEARNED_SONG_ID,
      songId: rawSongId || DEFAULT_SONG_ID,  // 문자열 그대로 사용
      situation: sp.get("situation") ?? DEFAULT_SITUATION,
      location: sp.get("location") ?? DEFAULT_LOCATION,
    };
    
    
    
    return result;
  }, [sp]);

  const STORAGE_KEY = `quiz-progress:${learnedSongId}`;

  const lastFetchedQRef = useRef<number | null>(null);
  const [qNum, setQNum] = useState<number>(
    getInitialQ(window.location.search, STORAGE_KEY)
  );

  const [question, setQuestion] = useState<QuizGenerateRes["data"] | null>(null);
  const [userInputs, setUserInputs] = useState<string[]>([]); // ✅ 변경: 다중 빈칸 입력
  const [openResult, setOpenResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [scoreThis, setScoreThis] = useState<number>(0); // 이번 문제 점수
  const [complete, setComplete] = useState<CompleteRes["data"] | null>(null);
  const [openSummary, setOpenSummary] = useState(false); // ✅ 완료 모달
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(qNum));
    const nsp = new URLSearchParams(window.location.search);
    nsp.set("q", String(qNum));
    window.history.replaceState(null, "", `${window.location.pathname}?${nsp.toString()}`);
  }, [qNum, STORAGE_KEY]);

  useEffect(() => {
    if (qNum < 1 || qNum > TOTAL_QUESTIONS) {
      setQNum(1);
      return;
    }
    if (lastFetchedQRef.current === qNum) return;
    lastFetchedQRef.current = qNum;

    (async () => {
      const requestData = {
        learnedSongId,
        songId,
        situation,
        location,
        questionNumber: qNum,
      };
      
      const res = await generateQuiz(requestData);
      setQuestion(res.data);
      // ✅ 답 개수만큼 입력칸 초기화
      const blanks = res.data.answer?.length ?? 1;
      setUserInputs(Array.from({ length: blanks }, () => ""));
      setIsCorrect(null);
      setScoreThis(0);
      setOpenResult(false);
      setElapsed(0);
    })();
  }, [qNum, learnedSongId, songId, situation, location]);

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
  const isLastQuestion = qNum >= TOTAL_QUESTIONS;

  // 제출 → 부분 채점(반올림) → 모달
  const onSubmitAnswer = useCallback(() => {
    if (!question) return;
    const userTokens = userInputs.map(normalizeToken);

    let correctCnt = 0;
    for (let i = 0; i < answerTokens.length; i++) {
      if (userTokens[i] === answerTokens[i]) correctCnt++;
    }
    const allCorrect = correctCnt === answerTokens.length;
    const score = Math.round((correctCnt / answerTokens.length) * POINTS_PER_Q);

    setIsCorrect(allCorrect);
    setScoreThis(score);
    setOpenResult(true);
  }, [answerTokens, question, userInputs]);

  // 결과 저장 후 다음 문제
  const onNextQuestion = useCallback(async () => {
    if (!question || isCorrect === null) return setOpenResult(false);

    const body: MarkingReq = {
      userId: userId || 0,
      blankId: question.blankId,
      isCorrect,
      score: scoreThis,
      originSentence: question.originSentence,
      question: question.question,
      correctAnswer: question.answer,
      userAnswer: userInputs,
    };
    await marking(body);

    setOpenResult(false);
    if (qNum < TOTAL_QUESTIONS) setQNum((n) => n + 1);
  }, [question, isCorrect, scoreThis, userInputs, qNum]);

  // 마지막 문제 모달에서 종료
  const finishFromModal = useCallback(async () => {
    if (!question || isCorrect === null) return setOpenResult(false);

    await marking({
      userId: userId || 0,
      blankId: question.blankId,
      isCorrect,
      score: scoreThis,
      originSentence: question.originSentence,
      question: question.question,
      correctAnswer: question.answer,
      userAnswer: userInputs,
    });

    const res = await completeQuiz({ learnedSongId });
    setComplete(res.data);
    localStorage.removeItem(STORAGE_KEY);
    setOpenResult(false);
    setOpenSummary(true); // ✅ 완료 요약 모달 열기
  }, [question, isCorrect, scoreThis, userInputs, learnedSongId, STORAGE_KEY]);

  // 스킵: 오답 저장 후 다음
  const onSkip = useCallback(async () => {
    if (!question) return;
    await marking({
      userId: userId || 0,
      blankId: question.blankId,
      isCorrect: false,
      score: 0,
      originSentence: question.originSentence,
      question: question.question,
      correctAnswer: question.answer,
      userAnswer: Array.from({ length: question.answer.length }, () => ""),
    });
    if (qNum < TOTAL_QUESTIONS) setQNum((n) => n + 1);
  }, [question, qNum]);

  const isCompleted = !!complete;

  return (
    <div className="bg-background text-foreground">
      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />
      <div
        className="mx-auto max-w-none w-[var(--shell-w)] px-[var(--shell-gutter)]"
        style={{ paddingTop: "calc(var(--nav-h) + 8px)" }}
      >
        {/* 상단 */}
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
            <div className="text-xs">
              {question ? `${question.title} - ${question.artists}` : "Loading..."}
            </div>
            <div className="text-sm font-semibold">{TOP_RIGHT_MODE}</div>
          </div>
        </div>

        {/* 진행 표시 */}
        <div className="mt-6 text-xs">
          Question {qNum} of {TOTAL_QUESTIONS}
        </div>
        <Progress value={progressPct} className="mt-2 h-2" />
        <div className="mt-1 text-right text-xs">{progressPct}% Complete</div>

        {/* 본문 */}
        {!isCompleted && (
          <div className="mx-auto mt-8 w-[min(980px,92vw)]">
            <Card className="border shadow-2xl">
              <CardHeader className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="rounded-full py-1 text-[12px]">
                    {POINTS_PER_Q} points
                  </Badge>
                  <div className="flex items-center gap-2 text-sm">
                    <Timer size={16} />
                    <span className="tabular-nums">{mmss(elapsed)}</span>
                  </div>
                  <Badge variant="outline" className="rounded-full py-1 text-[12px]">
                    Medium
                  </Badge>
                </div>

                <div className="font-bold">문제 {qNum}.</div>

                <CardTitle className="font-bold leading-relaxed text-[clamp(22px,2vw+12px,36px)]">
                  {/* ✅ 문장 내부에 인라인 입력칸 삽입 */}
                  <InlineBlankInputs
                    question={question ? question.question : "—"}
                    inputs={userInputs}
                    setInputs={(i, v) =>
                      setUserInputs((prev) => {
                        const copy = [...prev];
                        copy[i] = v;
                        return copy;
                      })
                    }
                    onEnterLast={onSubmitAnswer}
                  />
                </CardTitle>

                <p className="text-[15px]">{question?.korean ?? "문제를 불러오는 중..."}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* 버튼 라인 */}
                <div className="flex items-center justify-between">
                  <Button variant="ghost" className="h-10" onClick={onSkip}>
                    <SkipForward size={16} className="mr-2" />
                    Skip
                  </Button>

                  <div className="flex gap-2">
                    <Button className="h-10 px-5" onClick={onSubmitAnswer}>
                      Next Question &rsaquo;
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="h-6" />
          </div>
        )}
      </div>

      {/* 정답/오답 모달 */}
      <Dialog open={openResult} onOpenChange={setOpenResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-700 mb-3">
              {isCorrect ? "정답입니다! 🎉" : "오답입니다! 😢"}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              {question && (
                <>
                  <div>
                    <span>문제: </span>
                    {question.question}
                  </div>
                  <div>
                    <span>정답: </span>
                    {question.answer.join(", ")}
                  </div>
                  <div>
                    <span>내 답: </span>
                    {userInputs.join(", ") || "—"}
                  </div>
                  <div>
                    <span>점수: </span>
                    {scoreThis} / {POINTS_PER_Q}
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setOpenResult(false)}>
              닫기
            </Button>

            {!isLastQuestion ? (
              <Button onClick={onNextQuestion} disabled={qNum >= TOTAL_QUESTIONS}>
                다음 문제
              </Button>
            ) : (
              <Button onClick={finishFromModal}>퀴즈 종료</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ 전체 결과 모달 */}
      <Dialog open={openSummary} onOpenChange={setOpenSummary}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>퀴즈 결과 요약</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              총 문제 {complete?.summary.totalQuestions}개 · 정답{" "}
              {complete?.summary.correctAnswers}개 · 총점 {complete?.summary.totalScore}점
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
              {complete?.results.map((r) => (
                <div key={r.blankResultId} className="rounded-xl border p-3 text-sm">
                  <div className="font-medium">
                    {formatQuestionWithBlanks(r.meta.question, r.meta.correctAnswer)}
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
                    <span className={r.isCorrect ? "text-green-500" : "text-rose-500"}>
                      {r.isCorrect ? "정답" : "오답"}
                    </span>{" "}
                    | 점수 {r.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setOpenSummary(false)}>
              닫기
            </Button>
            <Button onClick={() => {
              const params = new URLSearchParams();
              if (situation) params.set('situation', situation);
              if (location) params.set('location', location);
              const queryString = params.toString();
              window.location.href = `/songs/${songId}${queryString ? `?${queryString}` : ''}`;
            }}>
              곡으로 돌아가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
