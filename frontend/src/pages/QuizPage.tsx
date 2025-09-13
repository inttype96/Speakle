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

import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner"; // 가벼운 알림(성공/실패 등)
import {
  ChevronRight,
  SkipForward,
  Timer as TimerIcon,
  ArrowLeft,
} from "lucide-react"; // 아이콘들

// 공용 UI 컴포넌트(버튼/인풋/카드/프로그레스)
import Navbar from "@/components/common/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// 타입 정의와 서비스(API 호출)
import type {
  QuizGenReq,
  QuizGenRes,
  SubmitScoreReq,
  QuizResultItem,
} from "@/types/quiz";
import * as quizService from "@/services/quizService";

// 목업 디자인에 맞춰 초기 전체 문항 수(백엔드에서 내려주면 교체 가능)
const TOTAL_QUESTIONS = 10;

// 사용자가 입력한 문자열과 정답 문자열을 "느슨하게" 비교하기 위한 정규화 함수
// - 대소문자/공백/일부 문장부호를 제거한 뒤 비교한다.
const normalize = (s: string) =>
  s.toLowerCase().replace(/[\s\-_\.,"'’!?]/g, "").trim();

// 00:00 형태로 시간(초)을 표시하는 포맷터
const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function QuizPage() {
  /** 라우팅/쿼리 파라미터 처리 */
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  // URL 예: /learn/quiz?learned_song_id=1&song_id=10&situation=date&location=club&title=Blinding%20Lights&artist=The%20Weeknd
  const learned_song_id = Number(sp.get("learned_song_id") ?? 1);
  const song_id = Number(sp.get("song_id") ?? 1);
  const situation = sp.get("situation") ?? "date";
  const location = sp.get("location") ?? "club";
  const songTitle = sp.get("title") ?? ""; // 상단 우측 정보 카드(곡 제목)
  const artist = sp.get("artist") ?? "";   // 상단 우측 정보 카드(아티스트)

  /** 화면 상태값들 */
  const [currentNo, setCurrentNo] = useState(1);               // 현재 문제 번호(1부터 시작)
  const [question, setQuestion] = useState<QuizGenRes | null>(null); // 현재 문제 데이터
  const [translation, setTranslation] = useState("");          // 현재 문제 번역 텍스트
  const [userInput, setUserInput] = useState("");              // 사용자 입력값
  const [submitting, setSubmitting] = useState(false);         // 제출 중(disabled 처리용)
  const [score, setScore] = useState(0);                       // 누적 점수
  const [results, setResults] = useState<QuizResultItem[]>([]);// 각 문제의 결과 기록(리뷰/통계용)
  const [elapsed, setElapsed] = useState(0);                   // 해당 문제 경과 시간(초)

  /** 진행률(%) 계산: (푼 문항 수 / 전체 문항 수) * 100 */
  const progressPercent = useMemo(
    () => Math.min(100, Math.round(((currentNo - 1) / TOTAL_QUESTIONS) * 100)),
    [currentNo]
  );

  /**
   * [문제 타이머]
   * - 문제(blankId)가 바뀔 때마다 0초로 초기화
   * - 1초마다 elapsed를 +1
   */
  useEffect(() => {
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id); // 컴포넌트 언마운트 또는 문제 변경 시 정리
  }, [question?.blankId]);

  /**
   * [문제 가져오기]
   * - 백엔드 API에 요청해 문제 1개를 받아온다.
   * - 번역은 서버에서 내려줄 수도 있고, 그렇지 않다면 FE에서 별도 호출로 가져온다.
   */
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
      setQuestion(data);    // 현재 문제 저장
      setUserInput("");     // 입력창 초기화

      // 서버가 번역을 함께 내려주지 않는다고 가정하고 FE에서 번역 호출
      const ko = await quizService.translateToKo(
        data.blankedSentence || data.fullSentence
      );
      setTranslation(ko);
    },
    [learned_song_id, song_id, situation, location]
  );

  // 최초 진입 시 1번 문제를 불러온다.
  useEffect(() => {
    fetchQuestion(1);
  }, [fetchQuestion]);

  /**
   * [다음 문제로 이동하는 공통 함수]
   * - 정오(isCorrect)와 사용자 입력을 받아, 점수/결과 저장 → 서버에 전송 → 다음 문제 호출
   */
  const goNext = async (isCorrect: boolean, userTyped = "") => {
    if (!question) return;

    // 간단한 점수 정책(정답 10점/오답 0점)
    const thisScore = isCorrect ? 10 : 0;

    // 즉시 피드백(토스트)
    if (isCorrect) {
      toast.success("정답!", { description: "좋아요! 다음 문제로 가요." });
    } else if (userTyped) {
      toast.error("아쉬워요", { description: `정답: ${question.answerWord}` });
    } else {
      toast("건너뜀", { description: `정답: ${question.answerWord}` });
    }

    // 누적 점수 갱신
    setScore((prev) => prev + thisScore);

    // 결과 기록(리뷰/통계용)
    setResults((prev) => [
      ...prev,
      {
        questionNumber: question.questionNumber,
        fullSentence: question.fullSentence,
        isCorrect,
        userInput: userTyped,
        answerWord: question.answerWord,
      },
    ]);

    // 서버로 정오/점수 저장(실패해도 UX는 계속 진행)
    const payload: SubmitScoreReq = {
      userId: 0,             // TODO: 로그인 연동 시 실제 사용자 ID로 교체
      blankId: question.blankId,
      isCorrect,
      score: thisScore,
      // timeSpentSec: elapsed, // (백엔드가 원하면 주석 해제)
    };
    try {
      await quizService.submitScore(payload);
    } catch (e) {
      console.warn("submitScore failed", e);
    }

    // 마지막 문제면 종료 후 이전 화면으로
    if (currentNo >= TOTAL_QUESTIONS) {
      toast("퀴즈 종료!", {
        description: `최종 점수: ${score + thisScore} / ${TOTAL_QUESTIONS * 10}`,
      });
      navigate(-1);
      return;
    }

    // 다음 문제 호출
    const next = currentNo + 1;
    setCurrentNo(next);
    await fetchQuestion(next);
  };

  /** [제출] Enter 키나 버튼 클릭 시 호출 */
  const onSubmit = async () => {
    if (!question || submitting) return;
    setSubmitting(true);

    // 정답 비교(느슨한 비교)
    const isCorrect =
      normalize(userInput) === normalize(question.answerWord || "");

    await goNext(isCorrect, userInput);
    setSubmitting(false);
  };

  /** [건너뛰기] 사용자 입력 없이 오답 처리로 다음 문제 */
  const onSkip = async () => {
    if (!question || submitting) return;
    setSubmitting(true);
    await goNext(false, ""); // userTyped를 빈문자열로 전달
    setSubmitting(false);
  };

  /** 인풋에서 Enter 누르면 바로 제출 */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSubmit();
  };

  /**
   * [로딩 상태]
   * - 첫 문제를 아직 못 불러온 경우 간단한 플레이스홀더를 보여준다.
   */
  if (!question) {
    return (
      <div className="bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-5xl px-6 pt-16 md:pt-20">
          <div className="h-2 w-full rounded bg-muted" />
          <Card className="mt-6 p-8">
            <div className="h-6 w-24 rounded bg-muted animate-pulse" />
            <div className="mt-4 h-16 w-full rounded bg-muted animate-pulse" />
          </Card>
        </div>
      </div>
    );
  }

  /**
   * [실제 화면 렌더]
   * - 상단: "곡으로 돌아가기" / 우측 곡 정보 카드
   * - 진행률: "Question n of N" + Progress 바
   * - 문제 카드: 포인트/타이머/난이도 + 문제 문장 + 번역 + 입력 + Skip/Next
   */
  return (
    <div className="bg-background text-foreground">
      <Navbar />
      {/* Navbar가 fixed라면 상단 패딩으로 본문을 아래로 내려준다 */}
      <div className="mx-auto max-w-5xl px-6 pt-16 md:pt-20">
        {/* 상단: 뒤로가기 / 우측 정보 카드 */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[15px] text-foreground/90 hover:opacity-80"
          >
            <ArrowLeft className="h-5 w-5" />
            곡으로 돌아가기
          </button>

          {(songTitle || artist) && (
            <div className="rounded-lg border bg-card px-4 py-2 text-right shadow-sm">
              <div className="text-xs text-muted-foreground">
                {songTitle && artist
                  ? `${songTitle} - ${artist}`
                  : songTitle || artist}
              </div>
              <div className="text-sm font-semibold">빈칸 퀴즈</div>
            </div>
          )}
        </div>

        {/* 진행률 라벨 */}
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question {currentNo} of {TOTAL_QUESTIONS}
          </span>
          <span>{Math.max(progressPercent, 1)}% Complete</span>
        </div>

        {/* 진행률 바 */}
        <Progress value={Math.max(progressPercent, 1)} className="h-2" />

        {/* 문제 카드 */}
        <Card className="mt-6 border-violet-700/20 bg-card">
          <CardContent className="p-6 md:p-8">
            {/* 상단 배지 줄: 점수 / 타이머 / 난이도 */}
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-violet-600/20 px-3 py-1 text-xs font-medium text-violet-400">
                100 points
              </span>

              <span className="flex items-center gap-2 text-xs font-medium text-red-400">
                <TimerIcon className="h-4 w-4" />
                {formatTime(elapsed)}
              </span>

              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/80">
                Medium
              </span>
            </div>

            {/* 문제 문장 */}
            <div className="mb-2 text-[22px] font-bold tracking-wide text-violet-300 md:text-2xl">
              {question.blankedSentence}
            </div>

            {/* 한글 번역 */}
            <div className="mb-6 text-center text-sm text-muted-foreground">
              {translation}
            </div>

            {/* 입력 필드 */}
            <div className="mb-4">
              <Label htmlFor="answer" className="sr-only">
                정답 입력
              </Label>
              <Input
                id="answer"
                className="h-14 rounded-xl text-center text-sm tracking-wide"
                placeholder="빈칸에 들어갈 단어를 입력하세요"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={onKeyDown}
              />
            </div>

            {/* 하단 버튼 줄: Skip / Next */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={onSkip}
                disabled={submitting}
                aria-label="이 문제 건너뛰기"
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>

              <Button
                type="button"
                className="gap-2"
                onClick={onSubmit}
                disabled={submitting || !userInput.trim()}
                aria-label="다음 문제로 이동"
              >
                Next Question
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
