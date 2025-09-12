/**
 * 빈칸 퀴즈 진행 페이지 (주관식 입력 버전)
 * 흐름: 문제 생성 → 입력/제출(프론트 채점) → 정/오답 모달 → 다음 문제
 * 마지막 문제 제출 시 결과 페이지로 이동 (/quiz/result?learned_song_id=…)
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import BlankInputCard from "@/components/quiz/BlankInputCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { createQuiz, submitScore } from "@/services/quizService";
import { isCorrectAnswer } from "@/utils/quizUtils";
import type { QuizGenRes } from "@/types/quiz";

const USER_ID = 101;   // 데모용. 실제 서비스에선 auth에서 주입
const MAX_Q = 3;       // 현재 고정. 서버 응답으로 동적 처리도 가능

export default function QuizPage() {
  // 라우터 쿼리에서 학습 세션/곡/키워드 파라미터 수신
  const [sp] = useSearchParams();
  const learned_song_id = Number(sp.get("learned_song_id"));
  const song_id = Number(sp.get("song_id"));
  const situation = sp.get("situation") ?? "";
  const location = sp.get("location") ?? "";

  // 로컬 상태들
  const [questionNumber, setQuestionNumber] = useState(1);
  const [quiz, setQuiz] = useState<QuizGenRes | null>(null);
  const [userInput, setUserInput] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [checking, setChecking] = useState(false);
  const [openCorrect, setOpenCorrect] = useState(false);
  const [openWrong, setOpenWrong] = useState(false);

  const nav = useNavigate();

  /** 현재 번호로 문제 불러오기 */
  const loadQuestion = async () => {
    try {
      setLoadingQuestion(true);
      const data = await createQuiz({
        learned_song_id,
        situation,
        location,
        song_id,
        questionNumber,
      });
      setQuiz(data);
      setUserInput(""); // 입력 초기화
    } finally {
      setLoadingQuestion(false);
    }
  };

  // 문제 번호가 바뀔 때마다 새 문제 요청
  useEffect(() => {
    void loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionNumber]);

  /** 정답 제출 (프론트 채점 후 백엔드 보고) */
  const onSubmit = async () => {
    if (!quiz) return;
    setChecking(true);

    const correct = isCorrectAnswer(userInput, quiz.answerWord); // 대소문자/공백 무시
    const score = correct ? 10 : 0;

    // 점수 보고
    await submitScore({
      userId: USER_ID,
      blankId: quiz.blankId,
      isCorrect: correct,
      score,
    });

    // 피드백 모달
    correct ? setOpenCorrect(true) : setOpenWrong(true);
    setChecking(false);
  };

  /** 다음 문제 또는 결과 페이지 이동 */
  const onNext = () => {
    if (questionNumber >= MAX_Q) {
      nav(`/quiz/result?learned_song_id=${learned_song_id}`);
      return;
    }
    setOpenCorrect(false);
    setOpenWrong(false);
    setQuestionNumber((n) => n + 1);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* 상단 진행률 바 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          문제 {questionNumber} / {MAX_Q}
        </div>
        <div className="h-2 w-64 rounded bg-muted">
          <div
            className="h-2 rounded bg-foreground/80 transition-all"
            style={{ width: `${(questionNumber / MAX_Q) * 100}%` }}
          />
        </div>
      </div>

      {/* ✅ 사용자 입력형 카드 */}
      <BlankInputCard
        sentence={loadingQuestion ? "" : (quiz?.blankedSentence ?? "")}
        value={userInput}
        onChange={setUserInput}
        loading={checking || loadingQuestion}
        onSubmit={onSubmit}
      />

      {/* 정답 모달 */}
      <Dialog open={openCorrect} onOpenChange={setOpenCorrect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정답입니다 🎉</DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-muted-foreground">{quiz?.fullSentence}</p>
          <div className="mt-4 flex justify-end">
            <Button onClick={onNext}>다음 문제</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 오답 모달 */}
      <Dialog open={openWrong} onOpenChange={setOpenWrong}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>아쉬워요 😢</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">정답:</span> {quiz?.answerWord}
            </div>
            <div>
              <span className="font-medium text-foreground">원문:</span> {quiz?.fullSentence}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={onNext}>
              다음 문제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
