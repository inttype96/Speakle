import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/common/navbar";
import { useAuthStore } from "@/store/auth";
import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { pausePlaybackAPI } from "@/services/spotify";

// shadcn
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// icons
import { ChevronLeft, Volume2 } from "lucide-react";

// api
import {
  startDictation,
  submitDictation,
  completeDictation,
} from "@/services/dictationService";

import { type DictationItem } from "@/types/dictation";
import SpotifyWebPlayer from "@/components/song/SpotifyWebPlayer";

// ==== 유틸: 코어 문장을 글자 단위 토큰으로 쪼갬 (공백/문장부호 포함) ====
type Token = { ch: string; isInput: boolean };
const tokenize = (sentence: string): Token[] => {
  // 알파벳/숫자/아포스트로피는 입력, 나머지(공백, 하이픈, 쉼표, 마침표 등)는 그대로 보여주지만 입력칸 아님
  return Array.from(sentence).map((ch) => {
    const isInput = /[A-Za-z0-9']/u.test(ch);
    return { ch, isInput };
  });
};

// ==== 노래 재생 관련 유틸리티 ====

const BOX_BASE =
  "h-12 w-10 md:h-12 md:w-10 flex items-center justify-center rounded-lg border bg-background/40 text-lg font-medium";
const BOX_INPUT =
  "focus:outline-none text-center caret-transparent uppercase";
const GAP = "w-3 md:w-3"; // 공백 시 간격

export default function DictationPage() {
  const [sp] = useSearchParams();
  const learnedSongId = Number(sp.get("learned_song_id") || sp.get("learnedSongId"));
  const songIdFromQuery = sp.get("song_id") || sp.get("songId") || "";
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const { setIsPlaying: setGlobalIsPlaying, setShouldStopPlayer } = useSpotifyPlayer();

  // 진행상태
  const MAX_Q = 3;
  const [qNo, setQNo] = useState(1);
  const [item, setItem] = useState<DictationItem | null>(null);
  const lastFetchedQRef = useRef<number | null>(null);

  // 입력 상태
  const [tokens, setTokens] = useState<Token[]>([]);
  const [answers, setAnswers] = useState<string[]>([]); // 입력칸 인덱스만 관리
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // 모달
  const [openResult, setOpenResult] = useState(false);
  const [resultMsg, setResultMsg] = useState<"정답입니다!" | "오답입니다!">("오답입니다!");

  // 노래 재생 관련 상태
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [replayKey, setReplayKey] = useState(0); // Replay 버튼을 위한 key

  const progress = (qNo / MAX_Q) * 100;

  // 노래 재생 시간 업데이트 핸들러
  const handleTimeUpdate = useCallback((time: number, playing: boolean) => {
    // 입력 값 검증
    if (typeof time !== 'number' || isNaN(time) || time < 0) {
      console.warn('handleTimeUpdate: 유효하지 않은 time 값:', time);
      return;
    }
    
    if (typeof playing !== 'boolean') {
      console.warn('handleTimeUpdate: 유효하지 않은 playing 값:', playing);
      return;
    }
    
    setCurrentTime(time);
    setIsPlaying(playing);
    
    // item이 유효한지 확인
    if (!item) {
      console.warn('handleTimeUpdate: item이 null 또는 undefined입니다');
      return;
    }
    
    if (!hasStarted && playing) {
      setHasStarted(true);
    }
    
    // endTime에 도달했을 때 재생이 정지되었는지 확인
    if (item.endTime && typeof item.endTime === 'number' && time >= item.endTime && !playing) {
      setHasStarted(true); // 재생이 완료되었음을 표시
    }
  }, [item, hasStarted]);

  // 딕테이션 페이지 진입 시 음악 자동 정지
  useEffect(() => {
    console.log('🎵 Dictation: Page entered, checking if music should be stopped');
    const stopMusicOnEntry = async () => {
      try {
        await pausePlaybackAPI();
        setGlobalIsPlaying(false);
        setShouldStopPlayer(true);
        console.log('✅ Music stopped on dictation page entry');
      } catch (error) {
        console.error('❌ Failed to stop music on dictation page entry:', error);
      }
    };

    stopMusicOnEntry();
  }, []); // 빈 배열로 페이지 진입 시 한 번만 실행

  // 문제 로드
  const fetchQuestion = useCallback(async (no: number) => {
    try {
      // 입력 값 검증
      if (typeof no !== 'number' || isNaN(no) || no < 1) {
        console.error('fetchQuestion: 유효하지 않은 문제 번호:', no);
        return;
      }
      
      if (typeof learnedSongId !== 'number' || isNaN(learnedSongId) || learnedSongId < 1) {
        console.error('fetchQuestion: 유효하지 않은 learnedSongId:', learnedSongId);
        return;
      }
      
      const data = await startDictation({ learnedSongId, questionNumber: no });
      
      // 응답 데이터 검증
      if (!data) {
        console.error('fetchQuestion: 서버에서 빈 응답을 받았습니다');
        return;
      }
      
      if (!data.coreSentence || typeof data.coreSentence !== 'string') {
        console.error('fetchQuestion: 유효하지 않은 coreSentence:', data.coreSentence);
        return;
      }
      
      setItem(data);
      const tks = tokenize(data.coreSentence);
      setTokens(tks);
      // 입력칸 개수만큼 상태 초기화 (이전 값 유지 X — 재시도 시에는 모달만 닫고 그대로 유지)
      const blanksCount = tks.filter((t) => t.isInput).length;
      setAnswers((prev) => (prev.length === blanksCount ? prev : Array(blanksCount).fill("")));
      
      // 노래 재생 상태 초기화
      setHasStarted(false);
      setCurrentTime(0);
      setIsPlaying(false);
      // replayKey를 증가시켜서 SpotifyWebPlayer를 완전히 리렌더링
      setReplayKey(prev => prev + 1);
      
      // 포커스 초기화
      setTimeout(() => {
        const first = inputsRef.current.find((el) => !!el);
        first?.focus();
      }, 0);
    } catch (error) {
      console.error('fetchQuestion 에러:', error);
      // 에러 발생 시 기본값으로 설정
      setItem(null);
      setTokens([]);
      setAnswers([]);
    }
  }, [learnedSongId]);

  useEffect(() => {
    // 중복 요청 방지
    if (lastFetchedQRef.current === qNo) return;
    lastFetchedQRef.current = qNo;
      
    fetchQuestion(qNo);
    // 브라우저가 처음 로드 후 voice 목록을 비동기 로드하는 경우가 있어 한 번 더 준비
    const onVoices = () => {};
    window.speechSynthesis.onvoiceschanged = onVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [qNo, fetchQuestion]);

  // 페이지를 벗어날 때 노래 정지
  useEffect(() => {
    return () => {
      // 컴포넌트가 언마운트될 때 노래 정지
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 토큰 ↔ 입력칸 인덱스 매핑
  const inputMap = useMemo(() => {
    const map: number[] = [];
    let cursor = 0;
    tokens.forEach((t, i) => {
      if (t.isInput) {
        map[i] = cursor++;
      } else {
        map[i] = -1;
      }
    });
    return map;
  }, [tokens]);

  const composedUserAnswer = useMemo(() => {
    if (!tokens.length) return "";
    let idx = 0;
    return tokens
      .map((t) => (t.isInput ? (answers[idx++] || "") : t.ch))
      .join("");
  }, [tokens, answers]);

  // 입력 핸들러
  const handleChange = (inputIdx: number, v: string) => {
    const val = (v || "").slice(-1).toUpperCase(); // 마지막 한 글자만, 대문자로 변환
    setAnswers((prev) => {
      const next = [...prev];
      next[inputIdx] = val;
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, inputIdx: number) => {
    const key = e.key;

    // Backspace 처리
    if (key === "Backspace") {
      if (answers[inputIdx]) {
        // 현재 칸에 글자가 있으면 현재 칸의 글자 지우기
        setAnswers((prev) => {
          const next = [...prev];
          next[inputIdx] = "";
          return next;
        });
      } else {
        // 현재 칸에 글자가 없으면 이전 칸으로 이동하고 그 칸의 글자 지우기
        const prev = inputsRef.current[inputIdx - 1];
        if (prev) {
          prev.focus();
          prev.select?.();
          setAnswers((prevAnswers) => {
            const next = [...prevAnswers];
            next[inputIdx - 1] = "";
            return next;
          });
        }
      }
      return;
    }
    // 좌우 이동
    if (key === "ArrowLeft") {
      inputsRef.current[inputIdx - 1]?.focus();
      return;
    }
    if (key === "ArrowRight") {
      inputsRef.current[inputIdx + 1]?.focus();
      return;
    }
    // 입력 후 자동 이동
    setTimeout(() => {
      if (inputsRef.current[inputIdx + 1]) {
        inputsRef.current[inputIdx + 1]?.focus();
      }
    }, 0);
  };

  // 제출
  const onSubmit = useCallback(async () => {
    // item 유효성 검증
    if (!item) {
      console.error('onSubmit: item이 null 또는 undefined입니다');
      return;
    }
    
    if (!item.coreSentence || typeof item.coreSentence !== 'string') {
      console.error('onSubmit: 유효하지 않은 coreSentence:', item.coreSentence);
      return;
    }
    
    if (!item.dictationId || typeof item.dictationId !== 'number') {
      console.error('onSubmit: 유효하지 않은 dictationId:', item.dictationId);
      return;
    }
    
    const correct = item.coreSentence;
    const userAnswer = composedUserAnswer;

    // 대소문자 무시하고 비교
    const isCorrect = userAnswer.toLowerCase() === correct.toLowerCase();
    setResultMsg(isCorrect ? "정답입니다!" : "오답입니다!");
    setOpenResult(true);

    try {
      // 점수 규칙: 정답 5점/오답 0점
      await submitDictation({
        userId: userId || 0,
        dictationId: item.dictationId,
        isCorrect,
        score: isCorrect ? 5 : 0,
        meta: { userAnswer, correctAnswer: correct },
      });
    } catch (error) {
      console.error('submitDictation 에러:', error);
      // 에러가 발생해도 UI는 정상적으로 표시
    }
  }, [item, composedUserAnswer, userId]);

  // 다음 문제
  const onNext = useCallback(async () => {
    // 다음 문제로 넘어갈 때 음악 정지
    console.log('🎵 Dictation: Moving to next question, stopping music');
    try {
      await pausePlaybackAPI();
      setGlobalIsPlaying(false);
      setShouldStopPlayer(true);
      console.log('✅ Music stopped for next question');
    } catch (error) {
      console.error('❌ Failed to stop music for next question:', error);
    }

    setOpenResult(false);
    if (qNo < MAX_Q) {
      setQNo((n) => n + 1);
    } else {
      // 마지막 문제 완료 → 요약 모달
      const summary = await completeDictation(learnedSongId);
      setSummary(summary);
      setOpenSummary(true);
    }
  }, [qNo, learnedSongId, setGlobalIsPlaying, setShouldStopPlayer]);

  // 요약 모달
  const [openSummary, setOpenSummary] = useState(false);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof completeDictation>> | null>(null);

  // 곡 상세로
  const goSong = () => {
    const songId = item?.songId || songIdFromQuery || "";
    if (!songId) {
      navigate("/");
      return;
    }

    // 현재 URL의 쿼리 파라미터들을 가져와서 유지
    const currentParams = new URLSearchParams(window.location.search);
    const situation = currentParams.get("situation");
    const location = currentParams.get("location");
    
    // 쿼리 파라미터 구성
    const queryParams = new URLSearchParams();
    if (situation) queryParams.set("situation", situation);
    if (location) queryParams.set("location", location);
    
    const queryString = queryParams.toString();
    const to = `/songs/${songId}${queryString ? `?${queryString}` : ""}`;
    navigate(to);
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl pt-20 px-4 pb-16">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Button variant="ghost" size="icon" onClick={() => goSong()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span>곡으로 돌아가기</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-xs">Question {qNo} of {MAX_Q}</div>
          <div className="text-xs">{Math.round(progress)}% Complete</div>
        </div>
        <Progress value={progress} className="h-2 mb-6" />

        <Card className="bg-muted/20 border-muted/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Dictation</Badge>
                {item && (
                  <span className="text-sm text-muted-foreground">
                    {item.title ?? ""} — {item.artists.replace(/[\[\]']/g, '') ?? ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Volume2 className="h-4 w-4" />
                <span>Listen to the song and type the lyrics exactly.</span>
              </div>
            </div>

            {/* Spotify Web Player */}
            {item && (
              <div className="mb-6">
                <SpotifyWebPlayer
                  key={`${item.songId}-${replayKey}`}
                  trackId={item.songId}
                  trackName={item.title}
                  artistName={item.artists.replace(/[\[\]']/g, '')}
                  onTimeUpdate={handleTimeUpdate}
                  startTime={item.startTime}
                  endTime={item.endTime}
                />
                <div className="mt-2 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {item.startTime && item.endTime ? (
                      <>
                        {hasStarted && (!isPlaying || currentTime >= item.endTime) && (
                          <span className="ml-2 text-green-600 font-medium">✓ Time to answer!</span>
                        )}
                      </>
                    ) : (
                      "Listen to the song and type the lyrics you hear"
                    )}
                  </p>
                  
                  {/* 다시 재생 버튼 */}

                </div>
              </div>
            )}

            {/* 입력 그리드 */}
            <section className="mx-auto flex flex-col gap-3 items-center">
              <div className="flex flex-wrap gap-y-3">
                {tokens.map((t, ti) => {
                  if (!t.isInput) {
                    // 공백은 간격, 문장부호는 그대로 보여줌
                    if (t.ch === " ") return <div key={ti} className={GAP} />;
                    return (
                      <div key={ti} className={`${BOX_BASE} border-dashed text-muted-foreground`}>
                        {t.ch}
                      </div>
                    );
                  }
                  const inputIdx = inputMap[ti];
                  return (
                    <input
                      key={ti}
                      ref={(el: HTMLInputElement | null) => {
                        inputsRef.current[inputIdx] = el;
                      }}
                      className={`${BOX_BASE} ${BOX_INPUT}`}
                      value={answers[inputIdx] || ""}
                      onChange={(e) => handleChange(inputIdx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, inputIdx)}
                      maxLength={1}
                      inputMode="text"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  );
                })}
              </div>
            </section>

            <Separator className="my-8" />

            <div className="flex justify-center">
              <Button size="lg" onClick={onSubmit} className="px-8">답안 제출</Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* 결과 모달 */}
      <Dialog open={openResult} onOpenChange={setOpenResult}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{resultMsg}</DialogTitle>
            <DialogDescription>
              {resultMsg === "정답입니다!"
                ? "완벽해요! 다음 문제로 이동해 주세요."
                : "빈칸 중 하나라도 틀리면 오답입니다! 다시 들어보고 수정해 보세요."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            {/* 닫기: 입력값을 그대로 유지하고 모달만 닫음 (재시도) */}
            <Button variant="secondary" onClick={() => setOpenResult(false)}>닫기</Button>
            <Button onClick={onNext}>{qNo < MAX_Q ? "다음 문제" : "결과 보기"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 요약 모달 */}
      <Dialog open={openSummary} onOpenChange={setOpenSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게임 결과 요약</DialogTitle>
            <DialogDescription>수고했어요! 점수를 확인하고 곡으로 돌아가세요.</DialogDescription>
          </DialogHeader>

          {summary && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-xl bg-muted">
                  <div className="text-xs text-muted-foreground">총 문제</div>
                  <div className="text-2xl font-bold">{summary.summary.totalQuestions}</div>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <div className="text-xs text-muted-foreground">정답</div>
                  <div className="text-2xl font-bold text-green-500">{summary.summary.correctAnswers}</div>
                </div>
                <div className="p-3 rounded-xl bg-muted">
                  <div className="text-xs text-muted-foreground">점수</div>
                  <div className="text-2xl font-bold">{summary.summary.totalScore}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 max-h-60 overflow-auto pr-1">
                {summary.results.map((r) => (
                  <div key={r.dictationResultId} className="text-sm p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">문제 #{r.dictationId}</div>
                      <Badge variant={r.isCorrect ? "default" : "secondary"}>
                        {r.isCorrect ? "정답" : "오답"}
                      </Badge>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      <span className="block">입력: {r.meta.userAnswer}</span>
                      <span className="block">정답: {r.meta.correctAnswer}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="secondary" onClick={() => setOpenSummary(false)}>닫기</Button>
            <Button onClick={goSong}>곡으로 돌아가기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
