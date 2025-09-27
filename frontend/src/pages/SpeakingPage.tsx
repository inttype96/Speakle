// src/pages/SpeakingPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/common/navbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Mic, MicOff, Volume2, Timer } from "lucide-react";

import {
  evaluateSpeaking,
  submitSpeakingResult,
  blobToPCM16kBase64RAW,
} from "@/services/speakingService";
import type { SpeakingEvalRes } from "@/types/speaking";

// 표시용
const TOP_RIGHT_MODE = "스피킹";

// 기본값(쿼리가 없을 때)
const DEFAULT_LEARNED_SONG_ID = 1;
const DEFAULT_SONG_ID = "1";
const TOTAL_QUESTIONS = 3;
const POINTS_PER_Q = 5;

/** 초기 qNum: 1) URL ?q= → 2) localStorage(learnedSongId별 키) → 3) 1 */
function getInitialQ(search: string, storageKey: string): number {
  const sp = new URLSearchParams(search);
  const fromUrl = Number(sp.get("q"));
  if (Number.isFinite(fromUrl) && fromUrl >= 1 && fromUrl <= TOTAL_QUESTIONS) return fromUrl;

  const saved = Number(localStorage.getItem(storageKey));
  if (Number.isFinite(saved) && saved >= 1 && saved <= TOTAL_QUESTIONS) return saved;

  return 1;
}

const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

// 발음 점수에 따른 평가 메시지
const getSpeakingMessage = (score: number): string => {
  if (score >= 4) return "훌륭한 발음입니다🌟";
  if (score >= 3) return "괜찮은 발음입니다👍";
  return "발음을 더 연습해보세요💪";
};

export default function SpeakingPage() {
  const [sp] = useSearchParams();

  /** ✅ URL에서 필요한 파라미터들 파싱 */
  const { learnedSongId, songId, situation, location } = useMemo(() => {
    const lsid = Number(sp.get("learnedSongId"));
    const rawSongId = sp.get("songId");

    return {
      learnedSongId: Number.isFinite(lsid) ? lsid : DEFAULT_LEARNED_SONG_ID,
      songId: rawSongId || DEFAULT_SONG_ID,  // 문자열 그대로 사용
      situation: sp.get("situation"),
      location: sp.get("location"),
    };
  }, [sp]);

  /** ✅ learnedSongId별로 진행 저장 키 분리 */
  const STORAGE_KEY = `speaking-progress:${learnedSongId}`;

  // 진행/문항
  const [qNum, setQNum] = useState<number>(() =>
    getInitialQ(window.location.search, STORAGE_KEY)
  );
  const [evalData, setEvalData] = useState<SpeakingEvalRes["data"] | null>(null);

  // 녹음 상태
  const [recording, setRecording] = useState(false);
  const [recBlob, setRecBlob] = useState<Blob | null>(null);
  const [recUrl, setRecUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 타이머/모달/결과
  const [elapsed, setElapsed] = useState(0);
  const [openResult, setOpenResult] = useState(false);
  const [lastIsCorrect, setLastIsCorrect] = useState<boolean | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastRawScore, setLastRawScore] = useState<string | null>(null);
  const [openSummary, setOpenSummary] = useState(false);

  type OneResult = {
    q: number;
    speakingId: number;
    sentence: string;
    isCorrect: boolean;
    score: number;
    rawScore?: string;
  };
  const [results, setResults] = useState<OneResult[]>([]);
  const committedQSetRef = useRef<Set<number>>(new Set());
  const lastFetchedQRef = useRef<number | null>(null);

  const progressPct = Math.round(((qNum - 1) / TOTAL_QUESTIONS) * 100);
  const isLastQuestion = qNum >= TOTAL_QUESTIONS;

  /** ✅ qNum 동기화 (learnedSongId별로 저장) */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(qNum));
    const next = new URLSearchParams(window.location.search);
    next.set("q", String(qNum));
    window.history.replaceState(null, "", `${window.location.pathname}?${next.toString()}`);
  }, [qNum, STORAGE_KEY]);

  /** ✅ 문제 로드: learnedSongId를 URL에서 받아 그대로 req에 포함 */
  useEffect(() => {
    if (qNum < 1 || qNum > TOTAL_QUESTIONS) {
      setQNum(1);
      return;
    }
    if (lastFetchedQRef.current === qNum) return;
    lastFetchedQRef.current = qNum;

    (async () => {
      const res = await evaluateSpeaking({
        learnedSongId,
        situation: situation || "",
        location: location || "",
        songId,
        questionNumber: qNum,
      });
      setEvalData(res.data);
      setElapsed(0);

      // 이전 녹음 초기화
      setRecBlob(null);
      setRecUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setLastIsCorrect(null);
      setLastScore(null);
      setLastRawScore(null);
    })();
  }, [qNum, learnedSongId, songId, situation, location]);

  // 타이머
  useEffect(() => {
    if (!evalData || openSummary) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [evalData, openSummary]);

  // 원어민 발음 듣기
  const speak = useCallback(() => {
    if (!evalData?.coreSentence) return;
    const u = new SpeechSynthesisUtterance(evalData.coreSentence);
    const voices = speechSynthesis.getVoices();
    const en = voices.find((v) => /en(-|_)?(US|GB)/i.test(v.lang));
    if (en) u.voice = en;
    u.lang = "en-US";
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }, [evalData]);

  // 녹음 토글
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
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      alert("마이크 권한이 필요합니다. 브라우저 설정을 확인해주세요.");
      console.error(err);
    }
  }, [recording]);

  /** 제출 → 채점 (필요 시 learnedSongId를 함께 전송) */
  const onSubmit = useCallback(async () => {
    if (!evalData) return;
    if (!recBlob) {
      alert("먼저 마이크로 발음을 녹음해주세요!");
      return;
    }

    try {
      const base64RAW = await blobToPCM16kBase64RAW(recBlob);

      // speakingService에서 learnedSongId를 받도록 했으면 아래 주석 해제하여 함께 전송
      const res = await submitSpeakingResult({
        learnedSongId,                 // ← URL에서 받은 값 (서비스에서 사용한다면)
        speakingId: evalData.speakingId,
        script: evalData.coreSentence,
        audioBase64: base64RAW,
      } as any);

      setLastIsCorrect(res.data.isCorrect);
      setLastScore(res.data.score);
      const raw = (res.data as any)?.meta?.score;
      setLastRawScore(typeof raw === "string" ? raw : null);
      setOpenResult(true);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 415) {
        alert("서버가 JSON이 아닌 다른 형식을 기대하고 있습니다. (415)");
      } else if (status === 400) {
        alert("요청 형식이 올바르지 않습니다. (400)");
      } else if (status === 500) {
        alert("서버 내부 오류가 발생했습니다. (500)");
      } else {
        alert(`요청 실패: ${status ?? "네트워크/알 수 없음"}`);
      }
      console.error(err);
    }
  }, [evalData, recBlob, learnedSongId]);

  // 현재 문항 결과 커밋(1회)
  const commitCurrentResult = useCallback(() => {
    if (!evalData || lastIsCorrect === null || lastScore === null) return false;
    if (committedQSetRef.current.has(qNum)) return false;
    setResults((prev) => [
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

  const onNextQuestion = useCallback(() => {
    const ok = commitCurrentResult();
    setOpenResult(false);
    if (ok && qNum < TOTAL_QUESTIONS) setQNum((n) => n + 1);
  }, [commitCurrentResult, qNum]);

  const finishFromModal = useCallback(() => {
    commitCurrentResult();
    setOpenResult(false);
    setOpenSummary(true);
    localStorage.removeItem(STORAGE_KEY);
  }, [commitCurrentResult, STORAGE_KEY]);

  const summary = useMemo(() => {
    const totalQuestions = TOTAL_QUESTIONS;
    const correctAnswers = results.filter((r) => r.isCorrect).length;
    const totalScore = results.reduce((acc, r) => acc + (r.score || 0), 0);
    return { totalQuestions, correctAnswers, totalScore, results };
  }, [results]);

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

      <div className="mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20" style={{ maxWidth: '1024px', width: '100%' }}>
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
              {evalData ? `${evalData.title} - ${evalData.artists}` : "Loading..."}
            </div>
            <div className="text-sm font-['Pretendard'] font-bold text-white">{TOP_RIGHT_MODE}</div>
          </div>
        </div>

        {/* 게임 스타일 진행 표시 */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl mb-4">
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

        {/* 게임 스타일 스피킹 본문 */}
        <div className="flex justify-center w-full">
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden max-w-5xl w-full">
            <CardHeader className="flex flex-col gap-2 p-2 sm:p-3 lg:p-4 pb-1 text-center items-center">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="backdrop-blur-sm bg-white/20 px-3 py-1.5 rounded-full border border-white/30">
                    <span className="font-['Pretendard'] font-bold text-white text-sm">문제 {qNum}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
                  <Badge className="bg-[#7545c2]/80 text-white border-[#6a3cb7]/50 rounded-full py-1 px-2 text-xs font-['Pretendard'] font-medium">
                    Medium
                  </Badge>

                  <Badge className="bg-[#7545c2]/80 text-white border-[#6a3cb7]/50 rounded-full py-1 px-2 text-xs font-['Pretendard'] font-medium">
                    {POINTS_PER_Q} points
                  </Badge>

                  <div className="relative group">
                    <button
                      type="button"
                      onClick={speak}
                      className="inline-flex items-center gap-1.5 bg-[#6a3cb7]/80 hover:bg-[#9e6beb]/90 text-white border-[#B5A6E0]/50 rounded-full py-1 px-3 text-xs font-['Pretendard'] font-medium transition-all duration-300 shadow-lg hover:shadow-xl border"
                    >
                      <Volume2 size={14} />
                      Hint
                    </button>
                    {/* 툴팁 */}
                    <div className="absolute top-full right-0 mt-3 px-4 py-3 bg-gray-900 text-white text-sm font-['Pretendard'] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-2xl border border-gray-700">
                      클릭 시 원어민 발음을 들을 수 있습니다
                      <div className="absolute bottom-full right-4 w-0 h-0 border-l-5 border-r-5 border-b-5 border-transparent border-b-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pb-3 pt-3 text-center">
              <div className="w-full text-center mt-3">
                <div className="text-s font-['Pretendard'] text-white/90">주어진 문장을 정확한 발음으로 따라 읽어주세요</div>
              </div>
              <div className="backdrop-blur-sm bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <div className="font-['Pretendard'] font-medium leading-relaxed text-lg sm:text-xl lg:text-1xl text-white">
                  {evalData?.coreSentence ?? "문장을 불러오는 중..."}
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={toggleRecord}
                  className={[
                    "grid place-items-center rounded-full transition-all duration-300 shadow-2xl",
                    "h-20 w-20 sm:h-24 sm:w-24",
                    recording
                      ? "bg-rose-500 hover:bg-rose-600 animate-pulse"
                      : "bg-[#6a3cb7] hover:bg-[#9e6beb]",
                  ].join(" ")}
                  title={recording ? "녹음 중지" : "녹음 시작"}
                >
                  {recording ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
                </button>
                <div className="text-s font-['Pretendard'] text-white/90">마이크 버튼을 누르면 녹음이 시작됩니다</div>
                {recUrl && (
                  <div className="w-full max-w-md">
                    <audio src={recUrl} controls className="w-full rounded-lg" />
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={onSubmit}
                  disabled={!recBlob}
                  className="h-12 sm:h-14 rounded-xl px-6 sm:px-8 bg-[#4B2199]/90 hover:bg-[#4B2199] text-white font-['Pretendard'] font-bold text-base sm:text-lg disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:hover:shadow-xl"
                >
                  답안 제출 →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* 결과 모달 */}
      <Dialog open={openResult} onOpenChange={setOpenResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white-900 dark:text-white-700 mb-3">
              {lastScore !== null ? getSpeakingMessage(lastScore) : "발음 평가 중..."}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              {evalData && (
                <>
                  <div><span>문제: </span>{evalData.coreSentence}</div>
                  <div>
                    <span>점수: </span>
                    {lastScore} 점
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex flex-col sm:flex-row">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setOpenResult(false)}>
              닫기
            </Button>

            {!isLastQuestion ? (
              <Button type="button" className="w-full sm:w-auto bg-[#6a3cb7] hover:bg-[#9e6beb] text-white" onClick={onNextQuestion}>
                다음 문제
              </Button>
            ) : (
              <Button type="button" className="w-full sm:w-auto bg-[#6a3cb7] hover:bg-[#9e6beb] text-white" onClick={finishFromModal}>
                스피킹 종료
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 종료 요약 */}
      <Dialog open={openSummary} onOpenChange={setOpenSummary}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white-900 dark:text-white-700, mb-3">스피킹 결과 요약</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                <div className="text-sm">
                  총 문제 {summary.totalQuestions}개 · 정답 {summary.correctAnswers}개 · 총점 {summary.totalScore}점
                </div>
                <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
                  {summary.results.sort((a, b) => a.q - b.q).map((r) => (
                    <div key={r.q} className="rounded-xl border p-3 text-sm">
                      <div className="font-medium">문제 {r.q}</div>
                      <div className="mt-1">{r.sentence}</div>
                      <div className="mt-1">
                        결과:{" "}
                        <span className={r.isCorrect ? "text-green-500" : "text-rose-500"}>
                          {r.isCorrect ? "정답" : "오답"}
                        </span>{" "}
                        (  {r.score}점 )
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
                // q 파라미터 제거
                const next = new URLSearchParams(window.location.search);
                next.delete("q");
                window.history.replaceState(null, "", `${window.location.pathname}?${next.toString()}`);
              }}
            >
              처음으로
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

    // <div className="bg-background text-foreground font-sans min-h-screen">
    //   {/* Google Fonts Link */}
    //   <link rel="preconnect" href="https://fonts.googleapis.com" />
    //   <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    //   <link
    //     href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
    //     rel="stylesheet"
    //   />
    //   <Navbar />
    //   <div aria-hidden className="h-16 md:h-20" />

    //   {/* 상단 여백 줄임 (빨간색 영역) */}
    //   <div className="h-2" />

    //   <div className="mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20" style={{ maxWidth: '1024px', width: '100%' }}>
    //     {/* 상단 헤더 */}
    //     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 sm:gap-0">
    //       <button
    //         type="button"
    //         onClick={() => history.back()}
    //         className="inline-flex items-center gap-2 text-sm font-['Pretendard'] font-medium text-white hover:text-[#B5A6E0] transition-colors duration-200 px-3 sm:px-4 py-2 rounded-lg hover:bg-white/10"
    //       >
    //         <ChevronLeft size={18} />
    //         곡으로 돌아가기
    //       </button>

    //       <div className="backdrop-blur-sm bg-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-right border border-white/20">
    //         <div className="text-xs font-['Pretendard'] text-white/70 truncate max-w-[200px] sm:max-w-none">
    //           {evalData ? `${evalData.title} - ${evalData.artists}` : "Loading..."}
    //         </div>
    //         <div className="text-sm font-['Pretendard'] font-bold text-white">{TOP_RIGHT_MODE}</div>
    //       </div>
    //     </div>

    //     {/* 게임 스타일 진행 표시 */}
    //     <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl mb-4">
    //       <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2 sm:gap-0">
    //         <div className="text-sm font-['Pretendard'] font-bold text-white">
    //           Question {qNum} of {TOTAL_QUESTIONS}
    //         </div>
    //         <div className="text-sm font-['Pretendard'] font-medium text-[#B5A6E0]">
    //           {progressPct}% Complete
    //         </div>
    //       </div>
    //       <div className="relative">
    //         <div className="w-full bg-black/30 rounded-full h-3 backdrop-blur-sm">
    //           <div
    //             className="bg-[#4B2199] h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
    //             style={{ width: `${progressPct}%` }}
    //           />
    //         </div>
    //         <div className="absolute inset-0 bg-[#B5A6E0]/30 rounded-full animate-pulse" />
    //       </div>
    //     </div>

    //     {/* 게임 스타일 스피킹 본문 */}
    //     <div className="flex justify-center w-full">
    //       <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden max-w-5xl w-full">
    //         <CardHeader className="flex flex-col gap-2 p-2 sm:p-3 lg:p-4 text-center items-center">
    //           <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between w-full">
    //             <div className="flex items-center gap-2">
    //               <div className="backdrop-blur-sm bg-white/20 px-3 py-1.5 rounded-full border border-white/30">
    //                 <span className="font-['Pretendard'] font-bold text-white text-sm">문제 {qNum}</span>
    //               </div>
    //             </div>

    //             <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
    //               <Badge className="bg-[#7545c2]/80 text-white border-[#6a3cb7]/50 rounded-full py-1 px-2 text-xs font-['Pretendard'] font-medium">
    //                 Medium
    //               </Badge>

    //               <Badge className="bg-[#7545c2]/80 text-white border-[#6a3cb7]/50 rounded-full py-1 px-2 text-xs font-['Pretendard'] font-medium">
    //                 {POINTS_PER_Q} points
    //               </Badge>

    //               <div className="relative group">
    //                 <button
    //                   type="button"
    //                   onClick={speak}
    //                   className="inline-flex items-center gap-1.5 bg-[#6a3cb7]/80 hover:bg-[#9e6beb]/90 text-white border-[#B5A6E0]/50 rounded-full py-1 px-3 text-xs font-['Pretendard'] font-medium transition-all duration-300 shadow-lg hover:shadow-xl border"
    //                 >
    //                   <Volume2 size={14} />
    //                   Hint
    //                 </button>
    //                 {/* 툴팁 */}
    //                 <div className="absolute top-full right-0 mt-3 px-4 py-3 bg-gray-900 text-white text-sm font-['Pretendard'] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-2xl border border-gray-700">
    //                   클릭 시 원어민 발음을 들을 수 있습니다
    //                   <div className="absolute bottom-full right-4 w-0 h-0 border-l-5 border-r-5 border-b-5 border-transparent border-b-gray-900"></div>
    //                 </div>
    //               </div>
    //             </div>
    //           </div>
    //         </CardHeader>
    //         <CardContent className="space-y-10 pb-3 text-center">
    //           <div className="space-y-2 sm:space-y-3 w-full text-center mt-8">
    //             <div className="text-s font-['Pretendard'] text-white/90">주어진 문장을 정확한 발음으로 따라 읽어주세요</div>
    //           </div>

    //           <div className="backdrop-blur-sm bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
    //             <div className="font-['Pretendard'] font-medium leading-relaxed text-lg sm:text-xl lg:text-2xl text-white">
    //               {evalData?.coreSentence ?? "문장을 불러오는 중..."}
    //             </div>
    //           </div>

    //           <div className="flex flex-col items-center gap-4">
    //             <button
    //               type="button"
    //               onClick={toggleRecord}
    //               className={[
    //                 "grid place-items-center rounded-full transition-all duration-300 shadow-2xl",
    //                 "h-20 w-20 sm:h-24 sm:w-24",
    //                 recording
    //                   ? "bg-gradient-to-br from-rose-500/90 to-rose-600/90 hover:from-rose-500 hover:to-rose-600 animate-pulse"
    //                   : "bg-gradient-to-br from-[#4B2199]/90 to-[#B5A6E0]/90 hover:from-[#4B2199] hover:to-[#B5A6E0]",
    //               ].join(" ")}
    //               title={recording ? "녹음 중지" : "녹음 시작"}
    //             >
    //               {recording ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
    //             </button>
    //             <div className="text-sm font-['Pretendard'] text-white/80">마이크 버튼을 눌러 발음해보세요</div>
    //             {recUrl && (
    //               <div className="w-full max-w-md">
    //                 <audio src={recUrl} controls className="w-full rounded-lg" />
    //               </div>
    //             )}
    //           </div>

    //           <div className="flex justify-center">
    //             <Button
    //               type="button"
    //               onClick={onSubmit}
    //               disabled={!recBlob}
    //               className="h-12 sm:h-14 rounded-xl px-6 sm:px-8 bg-[#4B2199]/90 hover:bg-[#4B2199] text-white font-['Pretendard'] font-bold text-base sm:text-lg disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:hover:shadow-xl"
    //             >
    //               답안 제출 →
    //             </Button>
    //           </div>
    //         </CardContent>
    //       </Card>
    //     </div>
    //   </div>
    //   {/* 결과 모달 */}
    //   <Dialog open={openResult} onOpenChange={setOpenResult}>
    //     <DialogContent>
    //       <DialogHeader>
    //         <DialogTitle className="text-gray-900 dark:text-gray-700 mb-3">
    //           {lastScore !== null ? getSpeakingMessage(lastScore) : "발음 평가 중..."}
    //         </DialogTitle>
    //         <DialogDescription className="space-y-2">
    //           {evalData && (
    //             <>
    //               <div><span>문장: </span>{evalData.coreSentence}</div>
    //               <div>
    //                 <span>점수: </span>
    //                 {/* {lastScore} {lastRawScore ? `(raw: ${Number(lastRawScore).toFixed(2)})` : ""} */}
    //                 {lastScore}
    //               </div>
    //             </>
    //           )}
    //         </DialogDescription>
    //       </DialogHeader>
    //       <DialogFooter className="gap-2 flex flex-col sm:flex-row">
    //         <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setOpenResult(false)}>
    //           닫기
    //         </Button>

    //         {!isLastQuestion ? (
    //           <Button type="button" className="w-full sm:w-auto" onClick={onNextQuestion}>
    //             다음 문제
    //           </Button>
    //         ) : (
    //           <Button type="button" className="w-full sm:w-auto" onClick={finishFromModal}>
    //             스피킹 종료
    //           </Button>
    //         )}
    //       </DialogFooter>
    //     </DialogContent>
    //   </Dialog>

    //   {/* 종료 요약 */}
    //   <Dialog open={openSummary} onOpenChange={setOpenSummary}>
    //     <DialogContent className="max-w-2xl">
    //       <DialogHeader>
    //         <DialogTitle className="text-gray-900 dark:text-gray-700, mb-3">스피킹 결과 요약</DialogTitle>
    //         <DialogDescription asChild>
    //           <div className="space-y-3 pt-2">
    //             <div className="text-sm">
    //               총 문제 {summary.totalQuestions}개 · 정답 {summary.correctAnswers}개 · 총점 {summary.totalScore}점
    //             </div>
    //             <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
    //               {summary.results.sort((a, b) => a.q - b.q).map((r) => (
    //                 <div key={r.q} className="rounded-xl border p-3 text-sm">
    //                   <div className="font-medium">문제 {r.q}</div>
    //                   <div className="mt-1">{r.sentence}</div>
    //                   <div className="mt-1">
    //                     결과:{" "}
    //                     <span className={r.isCorrect ? "text-green-500" : "text-rose-500"}>
    //                       {r.isCorrect ? "정답" : "오답"}
    //                     </span>{" "}
    //                     | 점수 {r.score}
    //                     {typeof r.rawScore !== "undefined" ? ` (raw: ${Number(r.rawScore).toFixed(2)})` : ""}
    //                   </div>
    //                 </div>
    //               ))}
    //             </div>
    //           </div>
    //         </DialogDescription>
    //       </DialogHeader>
    //       <DialogFooter className="gap-2 flex-col sm:flex-row">
    //         <Button
    //           variant="secondary"
    //           onClick={() => {
    //             setOpenSummary(false);
    //             setQNum(1);
    //             setResults([]);
    //             committedQSetRef.current.clear();
    //             lastFetchedQRef.current = null;
    //             localStorage.removeItem(STORAGE_KEY);
    //             // q 파라미터 제거
    //             const next = new URLSearchParams(window.location.search);
    //             next.delete("q");
    //             window.history.replaceState(null, "", `${window.location.pathname}?${next.toString()}`);
    //           }}
    //         >
    //           처음으로
    //         </Button>
    //         <Button onClick={() => {
    //           const params = new URLSearchParams();
    //           if (situation) params.set('situation', situation);
    //           if (location) params.set('location', location);
    //           const queryString = params.toString();
    //           window.location.href = `/songs/${songId}${queryString ? `?${queryString}` : ''}`;
    //         }}>
    //           곡으로 돌아가기
    //         </Button>
    //       </DialogFooter>
    //     </DialogContent>
    //   </Dialog>
    // </div>

  //   <div className="bg-background text-foreground font-sans min-h-screen">
  //   {/* Google Fonts Link */}
  //   <link rel="preconnect" href="https://fonts.googleapis.com" />
  //   <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
  //   <link
  //     href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
  //     rel="stylesheet"
  //   />
  //   <Navbar />
  //   <div aria-hidden className="h-16 md:h-20" />

  //   {/* 상단 여백 추가 */}
  //   <div className="h-8" />

  //   <div className="mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20" style={{ maxWidth: '1024px', width: '100%' }}>
  //     {/* 상단 헤더 */}
  //     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 sm:gap-0">
  //       <button
  //         type="button"
  //         onClick={() => history.back()}
  //         className="inline-flex items-center gap-2 text-sm font-['Pretendard'] font-medium text-white hover:text-[#B5A6E0] transition-colors duration-200 px-3 sm:px-4 py-2 rounded-lg hover:bg-white/10"
  //       >
  //         <ChevronLeft size={18} />
  //         곡으로 돌아가기
  //       </button>

  //       <div className="backdrop-blur-sm bg-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-right border border-white/20">
  //         <div className="text-xs font-['Pretendard'] text-white/70 truncate max-w-[200px] sm:max-w-none">
  //           {evalData ? `${evalData.title} - ${evalData.artists}` : "Loading..."}
  //         </div>
  //         <div className="text-sm font-['Pretendard'] font-bold text-white">{TOP_RIGHT_MODE}</div>
  //       </div>
  //     </div>

  //     {/* 게임 스타일 진행 표시 */}
  //     <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl mb-8">
  //       <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2 sm:gap-0">
  //         <div className="text-sm font-['Pretendard'] font-bold text-white">
  //           Question {qNum} of {TOTAL_QUESTIONS}
  //         </div>
  //         <div className="text-sm font-['Pretendard'] font-medium text-[#B5A6E0]">
  //           {progressPct}% Complete
  //         </div>
  //       </div>
  //       <div className="relative">
  //         <div className="w-full bg-black/30 rounded-full h-3 backdrop-blur-sm">
  //           <div
  //             className="bg-[#4B2199] h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
  //             style={{ width: `${progressPct}%` }}
  //           />
  //         </div>
  //         <div className="absolute inset-0 bg-[#B5A6E0]/30 rounded-full animate-pulse" />
  //       </div>
  //     </div>

  //     {/* 게임 스타일 스피킹 본문 */}
  //     <div className="flex justify-center w-full">
  //       <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden max-w-5xl w-full">
  //         <CardHeader className="flex flex-col gap-3 p-3 sm:p-4 lg:p-5 text-center items-center">
  //           <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between w-full">
  //             <div className="flex items-center gap-2">
  //               <div className="backdrop-blur-sm bg-white/20 px-3 py-1.5 rounded-full border border-white/30">
  //                 <span className="font-['Pretendard'] font-bold text-white text-sm">문제 {qNum}</span>
  //               </div>
  //             </div>

  //             <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
  //               <Badge className="bg-[#7545c2]/80 text-white border-[#B5A6E0]/50 rounded-full py-1 px-2 text-xs font-['Pretendard'] font-medium">
  //                 Medium
  //               </Badge>
  //               <Badge className="bg-[#7545c2]/80 text-white border-[#B5A6E0]/50 rounded-full py-1 px-2 text-xs font-['Pretendard'] font-medium">
  //                 {POINTS_PER_Q} points
  //               </Badge>
  //               <div className="relative group">
  //                 <button
  //                   type="button"
  //                   onClick={speak}
  //                   className="inline-flex items-center gap-1.5 bg-[#7545c2]/80 hover:bg-[#4B2199]/90 text-white border-[#B5A6E0]/50 rounded-full py-1 px-3 text-xs font-['Pretendard'] font-medium transition-all duration-300 shadow-lg hover:shadow-xl border"
  //                 >
  //                   <Volume2 size={14} />
  //                   Hint
  //                 </button>
  //                 {/* 툴팁 */}
  //                 <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black/90 text-white text-xs font-['Pretendard'] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
  //                   클릭 시 원어민 발음을 들을 수 있습니다
  //                 <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
  //               </div>
  //               </div>
  //             </div>
  //           </div>

  //           <div className="space-y-4 sm:space-y-6 w-full text-center">
  //             <div className="text-s font-['Pretendard'] text-white/90">주어진 문장을 정확한 발음으로 따라 읽어주세요</div>
  //           </div>
  //         </CardHeader>

  //         <CardContent className="space-y-6 pb-8 text-center">
  //           <div className="backdrop-blur-sm bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
  //             <div className="font-['Pretendard'] font-medium leading-relaxed text-lg sm:text-xl lg:text-2xl text-white">
  //               {evalData?.coreSentence ?? "문장을 불러오는 중..."}
  //             </div>
  //           </div>

  //           <div className="flex flex-col items-center gap-4">
  //             <button
  //               type="button"
  //               onClick={toggleRecord}
  //               className={[
  //                 "grid place-items-center rounded-full transition-all duration-300 shadow-2xl",
  //                 "h-20 w-20 sm:h-24 sm:w-24",
  //                 recording
  //                   ? "bg-gradient-to-br from-rose-500/90 to-rose-600/90 hover:from-rose-500 hover:to-rose-600 animate-pulse"
  //                   : "bg-gradient-to-br from-[#4B2199]/90 to-[#B5A6E0]/90 hover:from-[#4B2199] hover:to-[#B5A6E0]",
  //               ].join(" ")}
  //               title={recording ? "녹음 중지" : "녹음 시작"}
  //             >
  //               {recording ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
  //             </button>
  //             <div className="text-sm font-['Pretendard'] text-white/80">마이크 버튼을 눌러 발음해보세요</div>
  //             {recUrl && (
  //               <div className="w-full max-w-md">
  //                 <audio src={recUrl} controls className="w-full rounded-lg" />
  //               </div>
  //             )}
  //           </div>

  //           <div className="flex justify-center">
  //             <Button
  //               type="button"
  //               onClick={onSubmit}
  //               disabled={!recBlob}
  //               className="h-12 sm:h-14 rounded-xl px-6 sm:px-8 bg-[#4B2199]/90 hover:bg-[#4B2199] text-white font-['Pretendard'] font-bold text-base sm:text-lg disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:hover:shadow-xl"
  //             >
  //               답안 제출 →
  //             </Button>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   </div>
  //   {/* 결과 모달 */}
  //   <Dialog open={openResult} onOpenChange={setOpenResult}>
  //     <DialogContent>
  //       <DialogHeader>
  //         <DialogTitle className="text-gray-900 dark:text-gray-700 mb-3">
  //           {lastScore !== null ? getSpeakingMessage(lastScore) : "발음 평가 중..."}
  //         </DialogTitle>
  //         <DialogDescription className="space-y-2">
  //           {evalData && (
  //             <>
  //               <div><span>문장: </span>{evalData.coreSentence}</div>
  //               <div>
  //                 <span>점수: </span>
  //                 {/* {lastScore} {lastRawScore ? `(raw: ${Number(lastRawScore).toFixed(2)})` : ""} */}
  //                 {lastScore}
  //               </div>
  //             </>
  //           )}
  //         </DialogDescription>
  //       </DialogHeader>
  //       <DialogFooter className="gap-2 flex flex-col sm:flex-row">
  //         <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setOpenResult(false)}>
  //           닫기
  //         </Button>

  //         {!isLastQuestion ? (
  //           <Button type="button" className="w-full sm:w-auto" onClick={onNextQuestion}>
  //             다음 문제
  //           </Button>
  //         ) : (
  //           <Button type="button" className="w-full sm:w-auto" onClick={finishFromModal}>
  //             스피킹 종료
  //           </Button>
  //         )}
  //       </DialogFooter>
  //     </DialogContent>
  //   </Dialog>

  //   {/* 종료 요약 */}
  //   <Dialog open={openSummary} onOpenChange={setOpenSummary}>
  //     <DialogContent className="max-w-2xl">
  //       <DialogHeader>
  //         <DialogTitle className="text-gray-900 dark:text-gray-700, mb-3">스피킹 결과 요약</DialogTitle>
  //         <DialogDescription asChild>
  //           <div className="space-y-3 pt-2">
  //             <div className="text-sm">
  //               총 문제 {summary.totalQuestions}개 · 정답 {summary.correctAnswers}개 · 총점 {summary.totalScore}점
  //             </div>
  //             <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
  //               {summary.results.sort((a, b) => a.q - b.q).map((r) => (
  //                 <div key={r.q} className="rounded-xl border p-3 text-sm">
  //                   <div className="font-medium">문제 {r.q}</div>
  //                   <div className="mt-1">{r.sentence}</div>
  //                   <div className="mt-1">
  //                     결과:{" "}
  //                     <span className={r.isCorrect ? "text-green-500" : "text-rose-500"}>
  //                       {r.isCorrect ? "정답" : "오답"}
  //                     </span>{" "}
  //                     | 점수 {r.score}
  //                     {typeof r.rawScore !== "undefined" ? ` (raw: ${Number(r.rawScore).toFixed(2)})` : ""}
  //                   </div>
  //                 </div>
  //               ))}
  //             </div>
  //           </div>
  //         </DialogDescription>
  //       </DialogHeader>
  //       <DialogFooter className="gap-2 flex-col sm:flex-row">
  //         <Button
  //           variant="secondary"
  //           onClick={() => {
  //             setOpenSummary(false);
  //             setQNum(1);
  //             setResults([]);
  //             committedQSetRef.current.clear();
  //             lastFetchedQRef.current = null;
  //             localStorage.removeItem(STORAGE_KEY);
  //             // q 파라미터 제거
  //             const next = new URLSearchParams(window.location.search);
  //             next.delete("q");
  //             window.history.replaceState(null, "", `${window.location.pathname}?${next.toString()}`);
  //           }}
  //         >
  //           처음으로
  //         </Button>
  //         <Button onClick={() => {
  //           const params = new URLSearchParams();
  //           if (situation) params.set('situation', situation);
  //           if (location) params.set('location', location);
  //           const queryString = params.toString();
  //           window.location.href = `/songs/${songId}${queryString ? `?${queryString}` : ''}`;
  //         }}>
  //           곡으로 돌아가기
  //         </Button>
  //       </DialogFooter>
  //     </DialogContent>
  //   </Dialog>
  // </div>

  );
}
