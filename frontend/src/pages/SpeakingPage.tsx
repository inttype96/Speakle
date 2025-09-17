// src/pages/SpeakingPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/common/navbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Mic, MicOff, Volume2, Timer, SkipForward } from "lucide-react";

import {
  evaluateSpeaking,
  submitSpeakingResult,
  blobToBase64String,
} from "@/services/speakingService";
import type { SpeakingEvalRes } from "@/types/speaking";

// 우측 상단 표시(예시)
const TOP_RIGHT_SONG = "Blinding Lights - The Weeknd";
const TOP_RIGHT_MODE = "스피킹";

// 기본 파라미터
const DEFAULT_LEARNED_SONG_ID = 1;
const TOTAL_QUESTIONS = 3;
const POINTS_PER_Q = 100;

// 진행 저장 키
const STORAGE_KEY = `speaking-progress:${DEFAULT_LEARNED_SONG_ID}`;

// 초기 qNum 결정: 1) URL ?q= → 2) localStorage → 3) 1
function getInitialQ(): number {
  const sp = new URLSearchParams(window.location.search);
  const fromUrl = Number(sp.get("q"));
  if (Number.isFinite(fromUrl) && fromUrl >= 1 && fromUrl <= TOTAL_QUESTIONS) return fromUrl;
  const saved = Number(localStorage.getItem(STORAGE_KEY));
  if (Number.isFinite(saved) && saved >= 1 && saved <= TOTAL_QUESTIONS) return saved;
  return 1;
}

// 00:00 포맷
const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

export default function SpeakingPage() {
  // 진행/문항
  const [qNum, setQNum] = useState<number>(getInitialQ());
  const [evalData, setEvalData] = useState<SpeakingEvalRes["data"] | null>(null);

  // 녹음 상태
  const [recording, setRecording] = useState(false);
  const [recBlob, setRecBlob] = useState<Blob | null>(null);
  const [recUrl, setRecUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 타이머(문제 경과)
  const [elapsed, setElapsed] = useState(0);

  // 결과 모달(한 문항)
  const [openResult, setOpenResult] = useState(false);
  const [lastIsCorrect, setLastIsCorrect] = useState<boolean | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastRawScore, setLastRawScore] = useState<string | null>(null);

  // 요약 모달(전체)
  const [openSummary, setOpenSummary] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // 누적 결과(프론트 계산용)
  type OneResult = { q: number; speakingId: number; sentence: string; isCorrect: boolean; score: number; rawScore?: string };
  const [results, setResults] = useState<OneResult[]>([]);
  const committedQSetRef = useRef<Set<number>>(new Set()); // 중복 커밋 방지

  // StrictMode 중복요청 가드
  const lastFetchedQRef = useRef<number | null>(null);

  // 진행율
  const progressPct = Math.round(((qNum - 1) / TOTAL_QUESTIONS) * 100);
  const isLastQuestion = qNum >= TOTAL_QUESTIONS;
  const title = useMemo(() => `문제 ${qNum}`, [qNum]);

  // qNum 동기화 (URL ?q=, localStorage)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(qNum));
    const sp = new URLSearchParams(window.location.search);
    sp.set("q", String(qNum));
    const newUrl = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [qNum]);

  // 문제 로드
  useEffect(() => {
    if (qNum < 1 || qNum > TOTAL_QUESTIONS) {
      setQNum(1);
      return;
    }

    // StrictMode 가드: 같은 qNum 재호출 방지
    if (lastFetchedQRef.current === qNum) return;
    lastFetchedQRef.current = qNum;

    (async () => {
      const res = await evaluateSpeaking({
        learnedSongId: DEFAULT_LEARNED_SONG_ID,
        questionNumber: qNum,
      });
      setEvalData(res.data);
      setElapsed(0);
      // 이전 녹음 클리어
      setRecBlob(null);
      setRecUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setLastIsCorrect(null);
      setLastScore(null);
      setLastRawScore(null);
    })();
  }, [qNum]);

  // 타이머
  useEffect(() => {
    if (!evalData || openSummary) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [evalData, openSummary]);

  // TTS (원어민 발음 듣기)
  const speak = useCallback(() => {
    if (!evalData?.coreSentence) return;
    const u = new SpeechSynthesisUtterance(evalData.coreSentence);
    const voices = speechSynthesis.getVoices();
    const en = voices.find(v => /en(-|_)?(US|GB)/i.test(v.lang));
    if (en) u.voice = en;
    u.lang = "en-US";
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }, [evalData]);

  // 녹음 시작/종료
  const toggleRecord = useCallback(async () => {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      alert("마이크 권한이 필요합니다. 브라우저 설정을 확인해주세요.");
      console.error(err);
    }
  }, [recording]);

  // 제출 → 채점
  const onSubmit = useCallback(async () => {
    if (!evalData) return;
    if (!recBlob) {
      alert("먼저 마이크로 발음을 녹음해주세요!");
      return;
    }
    const base64 = await blobToBase64String(recBlob);
    const res = await submitSpeakingResult({
      speakingId: evalData.speakingId,
      script: evalData.coreSentence,
      audioBase64: base64,
    });

    setLastIsCorrect(res.data.isCorrect);
    setLastScore(res.data.score);
    setLastRawScore(res.data.meta?.score ?? null);
    setOpenResult(true);
  }, [evalData, recBlob]);

  // 현재 문항 결과를 누적 목록에 1회만 커밋
  const commitCurrentResult = useCallback(() => {
    if (!evalData || lastIsCorrect === null || lastScore === null) return false;
    if (committedQSetRef.current.has(qNum)) return false;
    setResults(prev => [
      ...prev,
      {
        q: qNum,
        speakingId: evalData.speakingId,
        sentence: evalData.coreSentence,
        isCorrect: lastIsCorrect,
        score: lastScore,
        rawScore: lastRawScore ?? undefined,
      },
    ]);
    committedQSetRef.current.add(qNum);
    return true;
  }, [evalData, lastIsCorrect, lastScore, lastRawScore, qNum]);

  // 다음 문제
  const onNextQuestion = useCallback(() => {
    const ok = commitCurrentResult(); // 중복방지 내부처리
    setOpenResult(false);
    if (ok && qNum < TOTAL_QUESTIONS) setQNum(n => n + 1);
  }, [commitCurrentResult, qNum]);

  // 스킵(오답 처리) → 다음
  const onSkip = useCallback(() => {
    if (!evalData) return;
    if (committedQSetRef.current.has(qNum)) return; // 이미 커밋됐다면 무시
    setResults(prev => [
      ...prev,
      {
        q: qNum,
        speakingId: evalData.speakingId,
        sentence: evalData.coreSentence,
        isCorrect: false,
        score: 0,
      },
    ]);
    committedQSetRef.current.add(qNum);
    if (qNum < TOTAL_QUESTIONS) setQNum(n => n + 1);
  }, [evalData, qNum]);

  // 마지막 문제에서 종료(모달 버튼)
  const finishFromModal = useCallback(async () => {
    commitCurrentResult();
    setOpenResult(false);
    setOpenSummary(true);
    localStorage.removeItem(STORAGE_KEY);
  }, [commitCurrentResult]);

  // 요약 계산(프론트)
  const summary = useMemo(() => {
    const totalQuestions = TOTAL_QUESTIONS;
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const totalScore = results.reduce((acc, r) => acc + (r.score || 0), 0);
    return { totalQuestions, correctAnswers, totalScore, results };
  }, [results]);

  return (
    <div className="bg-background text-foreground">
      {/* Navbar + 스페이서 */}
      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />

      {/* 상단 레이아웃 (뒤로가기 / 우측 곡정보) */}
      <div className="mx-auto w-[var(--shell-w)] px-[var(--shell-gutter)]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => history.back()}
            className="inline-flex items-center gap-2 text-[15px]"
          >
            <ChevronLeft size={18} />
            곡으로 돌아가기
          </button>

          <div className="hidden md:block rounded-md px-4 py-2.5 text-right">
            <div className="text-xs">{TOP_RIGHT_SONG}</div>
            <div className="text-sm font-semibold">{TOP_RIGHT_MODE}</div>
          </div>
        </div>

        {/* 진행 정보 + 바 */}
        <div className="mt-6 text-xs">
          Question {qNum} of {TOTAL_QUESTIONS}
        </div>
        <Progress value={Math.min(progressPct, 100)} className="mt-2 h-2" />
        <div className="mt-1 text-right text-[11px] sm:text-xs">
          {progressPct}% Complete
        </div>
      </div>

      {/* 본문 카드 */}
      <div className="mx-auto mt-8 mb-24 w-[min(940px,88vw)]">
        <Card className="border shadow-2xl">
          <CardHeader className="flex flex-col items-center gap-2 pt-8">
            <div className="text-sm">{title}</div>
            <div className="text-xs">주어진 문장을 정확한 발음으로 따라 읽어주세요</div>

            {/* 상단 라벨: 포인트/타이머/난이도 */}
            <div className="mt-3 flex items-center gap-3">
              <Badge className="rounded-full"> {POINTS_PER_Q} points </Badge>
              <span className="inline-flex items-center gap-1 text-sm">
                <Timer size={16} /> {mmss(elapsed)}
              </span>
              <Badge variant="outline" className="rounded-full">Medium</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {/* 코어 문장 */}
            <div className="mx-auto w-full rounded-xl border px-5 py-4 text-center text-[17px]">
              {evalData?.coreSentence ?? "Loading..."}
            </div>

            {/* 원어민 발음 듣기 */}
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={speak}
                className="h-9 rounded-full px-3"
                variant="secondary"
              >
                <Volume2 size={16} className="mr-2" />
                원어민 발음 듣기
              </Button>
            </div>

            {/* 마이크 버튼 */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={toggleRecord}
                className={[
                  "grid place-items-center rounded-full transition-all",
                  "h-20 w-20 sm:h-24 sm:w-24",
                  recording ? "bg-rose-600/80 hover:bg-rose-600" : "bg-violet-600 hover:bg-violet-500",
                ].join(" ")}
                title={recording ? "녹음 중지" : "녹음 시작"}
              >
                {recording ? <MicOff size={26} /> : <Mic size={26} />}
              </button>
              <div className="text-xs">
                마이크 버튼을 눌러 발음해보세요
              </div>

              {/* 내가 녹음한 오디오 재생 */}
              {recUrl && (
                <audio src={recUrl} controls className="mt-1 w-full max-w-md" />
              )}
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={onSubmit}
                disabled={!recBlob}
                className="h-10 rounded-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                답안 제출 ›
              </Button>
            </div>

            {/* 하단 현재 점수(이 문항 점수) */}
            <div className="mt-2 text-center text-xs">
              현재 점수: {lastScore ?? 0} / 4
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 결과 모달(한 문항) */}
      <Dialog open={openResult} onOpenChange={setOpenResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {lastIsCorrect ? "정답입니다! 🎉" : "오답입니다 😢"}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              {evalData && (
                <>
                  <div><span>문장: </span>{evalData.coreSentence}</div>
                  <div>
                    <span>점수: </span>
                    {lastScore} {lastRawScore ? `(raw: ${Number(lastRawScore).toFixed(2)})` : ""}
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex flex-col sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setOpenResult(false)}
            >
              닫기
            </Button>

            {/* 마지막 문제에선 '다음 문제' 대신 '스피킹 종료' */}
            {!isLastQuestion ? (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={onNextQuestion}
              >
                다음 문제
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={finishFromModal}
                disabled={finishing}
              >
                {finishing ? "종료 중..." : "스피킹 종료"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 종료 요약 모달(전체) */}
      <Dialog open={openSummary} onOpenChange={setOpenSummary}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>스피킹 결과 요약</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                <div className="text-sm">
                  총 문제 {summary.totalQuestions}개 · 정답 {summary.correctAnswers}개 · 총점 {summary.totalScore}점
                </div>
                <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
                  {summary.results
                    .sort((a, b) => a.q - b.q)
                    .map((r) => (
                    <div key={r.q} className="rounded-xl border p-3 text-sm">
                      <div className="font-medium">문제 {r.q}</div>
                      <div className="mt-1">{r.sentence}</div>
                      <div className="mt-1">
                        결과:{" "}
                        <span className={r.isCorrect ? "text-green-500" : "text-rose-500"}>
                          {r.isCorrect ? "정답" : "오답"}
                        </span>{" "}
                        | 점수 {r.score}
                        {typeof r.rawScore !== "undefined" ? ` (raw: ${Number(r.rawScore).toFixed(2)})` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => {
                setOpenSummary(false);
                setQNum(1);
                setResults([]);
                committedQSetRef.current.clear();
                lastFetchedQRef.current = null;
                localStorage.removeItem(STORAGE_KEY);
                window.history.replaceState(null, "", window.location.pathname);
              }}
            >
              처음으로
            </Button>
            <Button onClick={() => (window.location.href = "/")}>홈으로</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
