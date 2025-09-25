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
  
  // 정답 길이에 따른 입력칸 너비 계산
  const getInputWidth = (inputIndex: number) => {
    const currentInput = inputs[inputIndex] || "";
    const baseWidth = 80; // 기본 너비
    const charWidth = 12; // 글자당 너비
    const minWidth = 60; // 최소 너비
    const maxWidth = 200; // 최대 너비
    
    const calculatedWidth = Math.max(
      minWidth,
      Math.min(maxWidth, baseWidth + (currentInput.length * charWidth))
    );
    
    return `${calculatedWidth}px`;
  };
  
  return (
    <span className="leading-relaxed flex flex-wrap items-center gap-2 sm:gap-3 justify-center text-sm sm:text-base lg:text-lg">
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
                style={{ width: getInputWidth(i) }}
                className="h-10 sm:h-12 px-3 sm:px-4 rounded-xl border-2 border-white/30 bg-white text-black shadow-inner
                           outline-none focus:ring-2 focus:ring-[#B5A6E0] focus:border-[#4B2199] text-base sm:text-lg font-['Pretendard'] font-medium
                           text-center placeholder:text-center placeholder:text-gray-500
                           transition-all duration-300 ease-in-out hover:border-[#B5A6E0] hover:shadow-lg
                           focus:bg-white focus:shadow-xl"
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
      situation: sp.get("situation") || "daily_conversation",
      location: sp.get("location") || "cafe",
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
    <div className="bg-background text-foreground font-sans min-h-screen">
      {/* Google Fonts Link */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />

      {/* 상단 여백 추가 */}
      <div className="h-8" />

      <div className="w-screen px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20" style={{ maxWidth: '65vw' }}>
        {/* 상단 헤더 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 sm:gap-0">
          <button
            type="button"
            onClick={() => history.back()}
            className="inline-flex items-center gap-2 text-sm font-['Pretendard'] font-medium text-white hover:text-[#B5A6E0] transition-colors duration-200 px-3 sm:px-4 py-2 rounded-lg hover:bg-white/10"
          >
            <ChevronLeft size={18} />
            곡으로 돌아가기
          </button>

          <div className="backdrop-blur-sm bg-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-right border border-white/20">
            <div className="text-xs font-['Pretendard'] text-white/70 truncate max-w-[200px] sm:max-w-none">
              {question ? `${question.title} - ${question.artists}` : "Loading..."}
            </div>
            <div className="text-sm font-['Pretendard'] font-bold text-white">{TOP_RIGHT_MODE}</div>
          </div>
        </div>

        {/* 게임 스타일 진행 표시 */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2 sm:gap-0">
            <div className="text-sm font-['Pretendard'] font-bold text-white">
              Question {qNum} of {TOTAL_QUESTIONS}
            </div>
            <div className="text-sm font-['Pretendard'] font-medium text-[#B5A6E0]">
              {progressPct}% Complete
            </div>
          </div>
          <div className="relative">
            <div className="w-full bg-black/30 rounded-full h-3 backdrop-blur-sm">
              <div
                className="bg-[#4B2199] h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="absolute inset-0 bg-[#B5A6E0]/30 rounded-full animate-pulse" />
          </div>
        </div>

        {/* 게임 스타일 퀴즈 본문 */}
        {!isCompleted && (
          <div className="flex justify-center w-full">
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden max-w-5xl w-full">
              <CardHeader className="flex flex-col gap-3 p-3 sm:p-4 lg:p-5 text-center items-center">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="backdrop-blur-sm bg-white/20 px-3 py-1.5 rounded-full border border-white/30">
                      <span className="font-['Pretendard'] font-bold text-white text-sm">문제 {qNum}</span>
                    </div>
                    <Badge className="bg-[#4B2199]/80 text-white border-[#B5A6E0]/50 rounded-full py-1 px-2 text-xs font-['Pretendard'] font-medium">
                      {POINTS_PER_Q} points
                    </Badge>
                  </div>

                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-[#4B2199]/20 to-[#B5A6E0]/20 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg">
                      <Timer size={16} className="text-[#B5A6E0] animate-pulse sm:w-[18px] sm:h-[18px]" />
                      <span className="tabular-nums text-white font-['Inter'] font-bold text-base sm:text-lg tracking-wide drop-shadow-md">{mmss(elapsed)}</span>
                    </div>
                    <Badge className="bg-[#B5A6E0]/80 text-white border-[#4B2199]/50 rounded-full py-1 px-2 text-xs font-['Pretendard'] font-medium">
                      Medium
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6 w-full text-center">

                  <CardTitle className="font-['Pretendard'] font-bold leading-relaxed text-lg sm:text-xl lg:text-2xl text-center text-white">
                    {/* 게임 스타일 문제 표시 */}
                    <div className="backdrop-blur-sm bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                      <InlineBlankInputs
                        question={question ? question.question : "문제를 불러오는 중..."}
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
                    </div>
                  </CardTitle>

                  <div className="text-center">
                    <p className="text-base font-['Pretendard'] font-medium text-white backdrop-blur-sm bg-[#4B2199]/20 rounded-xl px-4 py-3 border border-[#B5A6E0]/30 inline-block">
                      {question?.korean ?? "문제를 불러오는 중..."}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 pt-0 flex flex-col items-center">
                {/* 게임 스타일 액션 버튼들 */}
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between w-full">
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto h-10 sm:h-12 px-4 sm:px-6 font-['Pretendard'] font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/30 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
                    onClick={onSkip}
                  >
                    <SkipForward size={16} className="mr-2" />
                    Skip
                  </Button>

                  <Button
                    className="w-full sm:w-auto h-10 sm:h-12 px-6 sm:px-8 font-['Pretendard'] font-bold text-base sm:text-lg bg-[#4B2199] hover:bg-[#5A2BB8] text-white border-2 border-[#B5A6E0]/50 hover:border-[#B5A6E0] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                    onClick={onSubmitAnswer}
                  >
                    <span className="hidden sm:inline">Next Question →</span>
                    <span className="sm:hidden">다음 →</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="h-6" />
          </div>
        )}
      </div>

      {/* 정답/오답 모달 */}
      <Dialog open={openResult} onOpenChange={setOpenResult}>
        <DialogContent className="backdrop-blur-xl bg-white/95 border border-white/30 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-['Pretendard'] font-bold text-2xl mb-4">
              {isCorrect ? (
                <span className="text-green-600">정답입니다! 🎉</span>
              ) : (
                <span className="text-red-600">오답입니다! 😢</span>
              )}
            </DialogTitle>
            <DialogDescription className="space-y-4 font-['Pretendard']">
              {question && (
                <>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <span className="font-semibold text-gray-700">문제: </span>
                    <span className="text-gray-900">{question.question}</span>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <span className="font-semibold text-green-700">정답: </span>
                    <span className="text-green-900 font-medium">{question.answer.join(", ")}</span>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="font-semibold text-blue-700">내 답: </span>
                    <span className="text-blue-900 font-medium">{userInputs.join(", ") || "—"}</span>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <span className="font-semibold text-purple-700">점수: </span>
                    <span className="text-purple-900 font-bold text-lg">{scoreThis} / {POINTS_PER_Q}</span>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 pt-4">
            <Button
              variant="secondary"
              className="font-['Pretendard'] font-medium px-6 py-2 rounded-xl"
              onClick={() => setOpenResult(false)}
            >
              닫기
            </Button>

            {!isLastQuestion ? (
              <Button
                className="font-['Pretendard'] font-bold px-6 py-2 bg-[#4B2199] hover:bg-[#5A2BB8] text-white rounded-xl"
                onClick={onNextQuestion}
                disabled={qNum >= TOTAL_QUESTIONS}
              >
                다음 문제
              </Button>
            ) : (
              <Button
                className="font-['Pretendard'] font-bold px-6 py-2 bg-[#4B2199] hover:bg-[#5A2BB8] text-white rounded-xl"
                onClick={finishFromModal}
              >
                퀴즈 종료
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 전체 결과 모달 */}
      <Dialog open={openSummary} onOpenChange={setOpenSummary}>
        <DialogContent className="max-w-2xl backdrop-blur-xl bg-white/95 border border-white/30 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-['Pretendard'] font-bold text-2xl text-[#4B2199] mb-4">
              🎊 퀴즈 완료! 🎊
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center p-4 bg-[#4B2199]/10 rounded-xl border border-[#B5A6E0]/30">
              <div className="font-['Pretendard'] font-bold text-lg text-[#4B2199]">
                총 문제 {complete?.summary.totalQuestions}개 · 정답{" "}
                <span className="text-green-600">{complete?.summary.correctAnswers}개</span> · 총점{" "}
                <span className="text-[#4B2199] text-xl">{complete?.summary.totalScore}점</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-auto pr-2">
              {complete?.results.map((r, index) => (
                <div key={r.blankResultId} className="backdrop-blur-sm bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-[#4B2199] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      r.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {r.isCorrect ? "정답" : "오답"} | {r.score}점
                    </span>
                  </div>
                  <div className="font-['Pretendard'] font-medium text-gray-900 mb-2">
                    {formatQuestionWithBlanks(r.meta.question, r.meta.correctAnswer)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-semibold text-green-600">정답: </span>
                      <span className="text-green-700">{r.meta.correctAnswer.join(", ")}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-blue-600">내 답: </span>
                      <span className="text-blue-700">{r.meta.userAnswer.join(", ") || "—"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-3 pt-6">
            <Button
              variant="secondary"
              className="font-['Pretendard'] font-medium px-6 py-2 rounded-xl"
              onClick={() => setOpenSummary(false)}
            >
              닫기
            </Button>
            <Button
              className="font-['Pretendard'] font-bold px-6 py-2 bg-[#4B2199] hover:bg-[#5A2BB8] text-white rounded-xl"
              onClick={() => {
                const params = new URLSearchParams();
                if (situation) params.set('situation', situation);
                if (location) params.set('location', location);
                const queryString = params.toString();
                window.location.href = `/songs/${songId}${queryString ? `?${queryString}` : ''}`;
              }}
            >
              곡으로 돌아가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
