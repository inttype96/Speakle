// src/pages/SpeakingPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/common/navbar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Mic, MicOff, Volume2, Timer } from "lucide-react";

import {
  evaluateSpeaking,
  submitSpeakingResult,
  blobToBase64String,
} from "@/services/speakingService";
import type { SpeakingEvalRes } from "@/types/speaking";

// 우측 상단 표시(예시)
const TOP_RIGHT_SONG = "Blinding Lights - The Weeknd";
const TOP_RIGHT_MODE = "빈칸 퀴즈"; // 상단 박스 디자인을 맞추기 위함(원한다면 '스피킹'으로 교체)

// 기본 파라미터
const DEFAULT_LEARNED_SONG_ID = 1;
const TOTAL_QUESTIONS = 3;
const POINTS_PER_Q = 100;

export default function SpeakingPage() {
  const [qNum, setQNum] = useState(1);

  // 문제
  const [evalData, setEvalData] = useState<SpeakingEvalRes["data"] | null>(null);

  // 녹음 상태
  const [recording, setRecording] = useState(false);
  const [recBlob, setRecBlob] = useState<Blob | null>(null);
  const [recUrl, setRecUrl] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 타이머(문제 경과)
  const [elapsed, setElapsed] = useState(0);

  // 결과 모달
  const [openResult, setOpenResult] = useState(false);
  const [lastIsCorrect, setLastIsCorrect] = useState<boolean | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastRawScore, setLastRawScore] = useState<string | null>(null);

  // 진행율은 빈칸퀴즈와 동일 방정식 사용
  const progressPct = Math.round(((qNum - 1) / TOTAL_QUESTIONS) * 100);

  // 문제 로드
  useEffect(() => {
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
    })();
  }, [qNum]);

  // 타이머
  useEffect(() => {
    if (!evalData) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [evalData]);

  // TTS (원어민 발음 듣기) — Web Speech API
  const speak = useCallback(() => {
    if (!evalData?.coreSentence) return;
    const u = new SpeechSynthesisUtterance(evalData.coreSentence);
    // 음성 선택(가능하다면 en-US 우선)
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
      // stop
      mediaRef.current?.stop();
      setRecording(false);
      return;
    }
    // start
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
        // 트랙 정리
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

  const mmss = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

  const title = useMemo(() => `문제 ${qNum}`, [qNum]);

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

            {/* 하단 현재 점수 (원하면 누적 로직로 교체 가능) */}
            <div className="mt-2 text-center text-xs">
              현재 점수: {lastScore ?? 0} / 4
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 결과 모달 */}
      <Dialog open={openResult} onOpenChange={setOpenResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {lastIsCorrect ? "정답입니다! 🎉" : "오답입니다 😢"}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              {evalData && (
                <>
                  <div>
                    <span>문장: </span>
                    {evalData.coreSentence}
                  </div>
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
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                setOpenResult(false);
                if (qNum < TOTAL_QUESTIONS) setQNum((n) => n + 1);
              }}
              disabled={qNum >= TOTAL_QUESTIONS}
            >
              다음 문제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
