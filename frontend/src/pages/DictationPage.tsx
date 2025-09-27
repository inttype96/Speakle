import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/common/navbar";
import { useAuthStore } from "@/store/auth";
import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { pausePlaybackAPI } from "@/services/spotify";

// shadcn
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// icons
import { ChevronLeft, Timer, Play, RotateCcw, Languages } from "lucide-react";

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

  const [hasStarted, setHasStarted] = useState(false);
  const [replayKey, setReplayKey] = useState(0); // Replay 버튼을 위한 key

  // 노래 재생 관련 상태
  const [_isPlaying, setIsPlaying] = useState(false);
  const [_currentTime, setCurrentTime] = useState(0);

  // 게임 상태
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'playing' | 'ended'>('ready');
  const [countdown, setCountdown] = useState(3);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [elapsed, setElapsed] = useState(0);

   // 한국어 가사 표시/숨김 상태
  const [showKorean, setShowKorean] = useState(false);

  // 메모장 상태
  const [memoText, setMemoText] = useState("");

  const progress = (qNo / MAX_Q) * 100;

  // 카운트다운 시작 함수
  const startCountdown = () => {
    setGameState('countdown');
    setCountdown(3);
    setShouldAutoPlay(false);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setGameState('playing');
          setShouldAutoPlay(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 다시 듣기 함수
  const onReplay = () => {
    setGameState('playing');        // 바로 재생 상태로
    setShouldAutoPlay(true);        // 자동재생 활성화
    setElapsed(0);                  // 타이머 리셋
    setReplayKey(prev => prev + 1); // SpotifyWebPlayer 리렌더링해서 즉시 재생
  };

  // 타이머 useEffect
  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  // mmss 포맷 함수
  const mmss = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

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
      setGameState('ended'); // 게임 종료 상태로 변경
      setShouldAutoPlay(false); // 자동재생 비활성화해서 다시 시작하지 않도록 함
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

      // 첫 단어를 미리 채워주기 위한 로직
      const initialAnswers = Array(blanksCount).fill("");
      if (blanksCount > 0) {
        // 첫 번째 입력칸에 해당하는 첫 단어 찾기
        let firstWordChars = [];
        let foundFirstInput = false;

        for (let i = 0; i < tks.length; i++) {
          if (tks[i].isInput) {
            if (!foundFirstInput) {
              foundFirstInput = true;
            }
            firstWordChars.push(tks[i].ch.toUpperCase());

            // 다음이 공백이거나 문장부호면 첫 단어 완료
            if (i + 1 < tks.length && !tks[i + 1].isInput) {
              break;
            }
          }
        }

        // 첫 단어의 글자들을 초기 답안에 설정
        for (let i = 0; i < firstWordChars.length && i < blanksCount; i++) {
          initialAnswers[i] = firstWordChars[i];
        }
      }

      setAnswers(initialAnswers);
      
      // 노래 재생 상태 초기화
      setHasStarted(false);
      setCurrentTime(0);
      setIsPlaying(false);
      // 게임 상태 초기화 - 첫 번째 문제는 ready, 나머지는 바로 카운트다운
      if (no === 1) {
        // 첫 번째 문제: 게임시작 버튼 표시
        setGameState('ready');
      } else {
        // 두 번째 문제부터: 바로 카운트다운 시작
        setGameState('countdown');
        setCountdown(3);

        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setGameState('playing');
              setShouldAutoPlay(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      setElapsed(0);
      setShouldAutoPlay(false);
      // 한국어 가사 표시 초기화
      setShowKorean(false);
      // 메모장 초기화
      setMemoText("");
      // replayKey를 증가시켜서 SpotifyWebPlayer를 완전히 리렌더링
      setReplayKey(prev => prev + 1);
      
      // 포커스 초기화 - 첫 번째 빈 칸에 포커스
      setTimeout(() => {
        const firstEmptyIndex = initialAnswers.findIndex((answer) => answer === "");
        const targetInput = firstEmptyIndex !== -1
          ? inputsRef.current[firstEmptyIndex]
          : inputsRef.current.find((el) => !!el);
        targetInput?.focus();
      }, 100);
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
    // 공백이나 탭 입력 시 무시하고 다음 칸으로 이동
    if (v.includes(' ') || v.includes('\t')) {
      const nextInput = inputsRef.current[inputIdx + 1];
      if (nextInput) {
        nextInput.focus();
      }
      return;
    }

    const val = (v || "").slice(-1).toUpperCase(); // 마지막 한 글자만, 대문자로 변환
    setAnswers((prev) => {
      const next = [...prev];
      next[inputIdx] = val;
      return next;
    });

    // 글자 입력 후 자동으로 다음 칸으로 이동
    if (val && inputIdx < inputsRef.current.length - 1) {
      const nextInput = inputsRef.current[inputIdx + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, inputIdx: number) => {
    const key = e.key;

    // 스페이스바 입력 시 아무 동작도 하지 않음 (입력 막기)
    if (key === " ") {
      e.preventDefault();
      return;
    }

    // Shift, Ctrl, Alt 등 수정 키는 무시 (다음 칸으로 이동하지 않음)
    if (key === "Shift" || key === "Control" || key === "Alt" || key === "Meta" || key === "CapsLock") {
      return;
    }

    // Tab 키는 기본 동작 막기
    if (key === "Tab") {
      e.preventDefault();
      return;
    }

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

    // 마지막 문제인 경우 바로 게임 결과로, 아니면 정답 모달 표시
    if (qNo >= MAX_Q) {
      // 마지막 문제 완료 → 바로 요약 모달로
      const summary = await completeDictation(learnedSongId);
      setSummary(summary);
      setOpenSummary(true);
    } else {
      // 마지막 문제가 아니면 정답 모달 표시
      setResultMsg(isCorrect ? "정답입니다!" : "오답입니다!");
      setOpenResult(true);
    }
  }, [item, composedUserAnswer, userId, qNo, learnedSongId]);

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

  // 전역 키보드 이벤트 핸들러
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 모달이 열려있거나 게임이 진행중이 아닐 때는 무시
      if (openResult || openSummary || gameState !== 'playing') return;

      // 알파벳이나 숫자 입력 시 현재 포커스된 입력칸이나 첫 번째 빈 칸에 포커스
      if (/^[A-Za-z0-9']$/.test(e.key)) {
        const activeElement = document.activeElement;
        const isInputFocused = inputsRef.current.some(input => input === activeElement);
        const isMemoFocused = activeElement?.tagName === 'TEXTAREA';

        if (!isInputFocused && !isMemoFocused) {
          // 현재 포커스가 입력칸에 없으면 첫 번째 빈 칸에 포커스
          const firstEmptyIndex = answers.findIndex((answer) => answer === "");
          const targetInput = firstEmptyIndex !== -1
            ? inputsRef.current[firstEmptyIndex]
            : inputsRef.current.find((el) => !!el);

          if (targetInput) {
            targetInput.focus();
            // 키 입력을 해당 입력칸에 전달
            setTimeout(() => {
              const event = new Event('input', { bubbles: true });
              targetInput.value = e.key.toUpperCase();
              targetInput.dispatchEvent(event);
            }, 0);
          }
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [answers, openResult, openSummary, gameState]);

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
            onClick={() => goSong()}
            className="inline-flex items-center gap-2 text-sm font-['Pretendard'] font-medium text-white hover:text-[#B5A6E0] transition-colors duration-200 px-3 sm:px-4 py-2 rounded-lg hover:bg-white/10"
          >
            <ChevronLeft size={18} />
            곡으로 돌아가기
          </button>

          <div className="backdrop-blur-sm bg-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-right border border-white/20">
            <div className="text-xs font-['Pretendard'] text-white/70 truncate max-w-[200px] sm:max-w-none">
              {item ? `${item.title} - ${item.artists.replace(/[\[\]']/g, '')}` : "Loading..."}
            </div>
            <div className="text-sm font-['Pretendard'] font-bold text-white">딕테이션</div>
          </div>
        </div>

        {/* 게임 스타일 진행 표시 */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 border border-white/20 shadow-2xl mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2 sm:gap-0">
            <div className="text-sm font-['Pretendard'] font-bold text-white">
              Question {qNo} of {MAX_Q}
            </div>
            <div className="text-sm font-['Pretendard'] font-medium text-[#B5A6E0]">
              {Math.round(progress)}% Complete
            </div>
          </div>
          <div className="relative">
            <div className="w-full bg-black/30 rounded-full h-3 backdrop-blur-sm">
              <div
                className="bg-[#4B2199] h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="absolute inset-0 bg-[#B5A6E0]/30 rounded-full animate-pulse" />
          </div>
        </div>

        {/* 게임 스타일 딕테이션 본문 */}
        <div className="flex justify-center w-full">
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden max-w-5xl w-full">
            <CardContent className="p-6 text-center">
              {/* 헤더 섹션 */}
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between w-full mb-6">
                <div className="flex items-center gap-2">
                  <div className="backdrop-blur-sm bg-white/20 px-3 py-1.5 rounded-full border border-white/30">
                    <span className="font-['Pretendard'] font-bold text-white text-sm">문제 {qNo}</span>
                  </div>
                  <Badge className="bg-[#4B2199]/80 text-white border-[#B5A6E0]/50 rounded-full py-1 px-2 text-xs font-['Pretendard'] font-medium">
                    5 points
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

              {/* 게임 상태별 UI */}
              <div className="space-y-8">

                {/* 카운트다운 화면 */}
                {gameState === 'countdown' && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="text-6xl sm:text-8xl font-['Inter'] font-black text-white animate-bounce mb-4">
                      {countdown}
                    </div>
                    <div className="text-lg sm:text-xl font-['Pretendard'] font-medium text-[#B5A6E0]">
                      곧 음악이 시작됩니다...
                    </div>
                  </div>
                )}

                {/* 게임 시작 대기 화면 */}
                {gameState === 'ready' && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="mb-8">
                      <div className="text-xl sm:text-2xl font-['Pretendard'] font-bold text-white mb-4 text-center">
                        🎵 음악을 들으며 가사를 맞춰보세요!
                      </div>
                      <div className="text-sm sm:text-base font-['Pretendard'] text-white/70 text-center">
                        시작 버튼을 누르면 3초 후 음악이 자동으로 재생됩니다
                      </div>
                    </div>
                    <Button
                      onClick={startCountdown}
                      className="h-14 px-8 bg-[#4B2199]/90 hover:bg-[#4B2199] text-white font-['Pretendard'] font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <Play size={20} className="mr-2" />
                      게임 시작
                    </Button>
                  </div>
                )}

                {/* 숨겨진 Spotify Player (자동재생용) - startTime 2초 일찍 시작 */}
                {item && (
                  <div className={gameState === 'playing' ? 'block' : 'hidden'}>
                    <SpotifyWebPlayer
                      key={`${item.songId}-${replayKey}-${shouldAutoPlay}`}
                      trackId={item.songId}
                      trackName={item.title}
                      artistName={item.artists.replace(/[\[\]']/g, '')}
                      onTimeUpdate={handleTimeUpdate}
                      startTime={item.startTime ? Math.max(0, item.startTime - 2000) : undefined}
                      endTime={item.endTime}
                      autoPlay={shouldAutoPlay}
                    />
                  </div>
                )}

                {/* 게임 진행 중 & 완료 화면 */}
                {(gameState === 'playing' || gameState === 'ended') && (
                  <>
                  <div className="flex justify-center gap-4 mb-6">
                      <Button
                        onClick={onReplay}
                        className="h-12 px-6 bg-[#B5A6E0]/80 hover:bg-[#B5A6E0] text-white font-['Pretendard'] font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <RotateCcw size={16} className="mr-2" />
                        다시 듣기
                      </Button>
                    </div>
                  {/* 한국어 가사 표시 영역 */}
                    {item?.korean && (
                      <div className="mb-6">
                        <div className="flex justify-center items-center gap-3 mb-4">
                          <Button
                            onClick={() => setShowKorean(!showKorean)}
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 bg-white/10 hover:bg-white/20 border-white/30 text-white hover:text-white font-['Pretendard'] font-medium transition-all duration-200"
                          >
                            <Languages size={16} className="mr-2" />
                            {showKorean ? '한국어 숨기기' : '한국어 보기'}
                          </Button>
                        </div>
                        
                        {showKorean && (
                          <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/20 mb-6">
                            <div className="text-sm font-['Pretendard'] text-white/70 mb-2 text-center">
                              🇰🇷 한국어 가사
                            </div>
                            <div className="text-base sm:text-lg font-['Pretendard'] text-white text-center leading-relaxed">
                              {item.korean}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 입력 그리드와 메모장을 나란히 배치 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* 놀라운 토요일 스타일 게임쇼 입력 그리드 */}
                      <div className="lg:col-span-2 backdrop-blur-sm bg-white/5 rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl">
                        <div className="mb-6 text-center">
                          <div className="text-lg sm:text-xl font-['Pretendard'] font-bold text-white mb-2">
                            🎤 가사를 입력하세요
                          </div>
                          <div className="text-sm font-['Pretendard'] text-white/70">
                            알파벳과 숫자만 입력하세요 (대소문자 구분 안함)
                          </div>
                        </div>

                        <section className="mx-auto flex flex-col gap-4 items-center max-w-4xl">
                          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                            {tokens.map((t, ti) => {
                              if (!t.isInput) {
                                // 공백은 간격, 문장부호는 그대로 보여줌
                                if (t.ch === " ") return <div key={ti} className="w-4 sm:w-6" />;
                                return (
                                  <div
                                    key={ti}
                                    className="h-10 w-8 sm:h-12 sm:w-10 flex items-center justify-center rounded-xl border-2 border-dashed border-[#B5A6E0]/50 bg-white/5 text-base sm:text-lg font-['Inter'] font-bold text-[#B5A6E0] backdrop-blur-sm shadow-lg"
                                  >
                                    {t.ch}
                                  </div>
                                );
                              }
                              const inputIdx = inputMap[ti];
                              const hasValue = answers[inputIdx] && answers[inputIdx] !== "";
                              return (
                                <input
                                  key={ti}
                                  ref={(el: HTMLInputElement | null) => {
                                    inputsRef.current[inputIdx] = el;
                                  }}
                                  className={`h-10 w-8 sm:h-12 sm:w-10 flex items-center justify-center rounded-xl border-2 text-center caret-transparent uppercase text-base sm:text-lg font-['Inter'] font-black transition-all duration-300 shadow-lg hover:shadow-xl focus:shadow-2xl ${
                                    hasValue
                                      ? 'border-[#4B2199] bg-gradient-to-br from-[#4B2199]/20 to-[#B5A6E0]/20 text-white backdrop-blur-md'
                                      : 'border-white/30 bg-white/10 text-white/50 backdrop-blur-sm hover:border-[#B5A6E0]/60 focus:border-[#4B2199] focus:bg-white/20'
                                  } focus:outline-none focus:ring-2 focus:ring-[#B5A6E0]/50`}
                                  value={answers[inputIdx] || ""}
                                  onChange={(e) => handleChange(inputIdx, e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, inputIdx)}
                                  maxLength={1}
                                  inputMode="text"
                                  autoCapitalize="off"
                                  autoCorrect="off"
                                  spellCheck={false}
                                  placeholder="?"
                                />
                              );
                            })}
                          </div>
                        </section>
                      </div>

                      {/* 메모장 */}
                      <div className="backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/20 shadow-2xl">
                        <div className="mb-4 text-center">
                          <div className="text-lg font-['Pretendard'] font-bold text-white mb-2">
                            📝 메모장
                          </div>
                          <div className="text-xs font-['Pretendard'] text-white/70">
                            들리는 대로 자유롭게 메모하세요
                          </div>
                        </div>

                        <textarea
                          value={memoText}
                          onChange={(e) => setMemoText(e.target.value)}
                          className="w-full h-48 p-4 rounded-xl bg-white/10 border border-white/30 text-white font-['Pretendard'] text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#B5A6E0]/50 focus:border-[#4B2199] placeholder-white/50 backdrop-blur-sm"
                          placeholder="들리는 대로 적어보세요...&#10;&#10;예시:&#10;hello world&#10;헬로 월드&#10;..."
                          spellCheck={false}
                          autoCorrect="off"
                        />

                        <div className="mt-3 flex justify-between items-center">
                          <div className="text-xs font-['Pretendard'] text-white/50">
                            {memoText.length}자
                          </div>
                          <button
                            onClick={() => setMemoText("")}
                            className="text-xs font-['Pretendard'] text-white/70 hover:text-white transition-colors duration-200 px-2 py-1 rounded hover:bg-white/10"
                          >
                            지우기
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center mt-8">
                      <Button
                        onClick={onSubmit}
                        className="h-14 sm:h-16 px-8 sm:px-12 bg-[#4B2199]/90 hover:bg-[#4B2199] text-white font-['Pretendard'] font-bold text-lg sm:text-xl rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                      >
                       답안 제출
                      </Button>
                    </div>
                  </>
                )}

              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 결과 모달 */}
      <Dialog open={openResult} onOpenChange={setOpenResult}>
        <DialogContent className="sm:max-w-3xl backdrop-blur-sm bg-[#1a1a2e]/95 border border-white/10">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-2xl font-['Pretendard'] font-bold text-white">
              {resultMsg === "정답입니다!" ? (
                <span className="text-[#B5A6E0]">정답입니다</span>
              ) : (
                <span className="text-white">오답입니다</span>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm font-['Pretendard'] text-white/60 mt-2">
              문제 {qNo} / {MAX_Q}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-6">
            {/* 내가 쓴 답 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-[#4B2199]"></div>
                <span className="text-sm font-['Pretendard'] font-semibold text-white/80 uppercase tracking-wider">Your Answer</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 p-6 bg-white/5 border border-white/10">
                {tokens.map((t, ti) => {
                  if (!t.isInput) {
                    if (t.ch === " ") return <div key={ti} className="w-3" />;
                    return (
                      <div
                        key={ti}
                        className="h-10 w-8 flex items-center justify-center border border-white/20 bg-white/5 text-base font-['Inter'] font-medium text-white/40"
                      >
                        {t.ch}
                      </div>
                    );
                  }
                  const inputIdx = inputMap[ti];
                  const userChar = answers[inputIdx] || "";
                  const correctChar = item?.coreSentence[ti].toUpperCase() || "";
                  const isCorrectChar = userChar === correctChar;

                  return (
                    <div
                      key={ti}
                      className={`h-10 w-8 flex items-center justify-center border-2 text-base font-['Inter'] font-bold transition-all ${
                        userChar
                          ? isCorrectChar
                            ? 'border-[#B5A6E0] bg-[#B5A6E0]/20 text-[#B5A6E0]'
                            : 'border-red-500/60 bg-red-500/10 text-red-400'
                          : 'border-white/20 bg-white/5 text-white/20'
                      }`}
                    >
                      {userChar || ""}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 정답 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-[#B5A6E0]"></div>
                <span className="text-sm font-['Pretendard'] font-semibold text-white/80 uppercase tracking-wider">Correct Answer</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 p-6 bg-[#4B2199]/10 border border-[#4B2199]/30">
                {tokens.map((t, ti) => {
                  if (!t.isInput) {
                    if (t.ch === " ") return <div key={ti} className="w-3" />;
                    return (
                      <div
                        key={ti}
                        className="h-10 w-8 flex items-center justify-center border border-[#4B2199]/30 bg-[#4B2199]/10 text-base font-['Inter'] font-medium text-[#B5A6E0]/60"
                      >
                        {t.ch}
                      </div>
                    );
                  }

                  const correctChar = item?.coreSentence[ti].toUpperCase() || "";
                  return (
                    <div
                      key={ti}
                      className="h-10 w-8 flex items-center justify-center border-2 border-[#B5A6E0] bg-[#B5A6E0]/20 text-[#B5A6E0] text-base font-['Inter'] font-bold"
                    >
                      {correctChar}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpenResult(false)}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 font-['Pretendard'] font-medium"
            >
              다시 듣기
            </Button>
            <Button
              onClick={onNext}
              className="bg-[#4B2199] hover:bg-[#4B2199]/80 text-white font-['Pretendard'] font-medium border-0"
            >
              {qNo < MAX_Q ? "다음 문제" : "결과 보기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 요약 모달 */}
      <Dialog open={openSummary} onOpenChange={setOpenSummary}>
        <DialogContent className="sm:max-w-2xl backdrop-blur-sm bg-[#1a1a2e]/95 border border-white/10">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-2xl font-['Pretendard'] font-bold text-white">
              게임 결과
            </DialogTitle>
            <DialogDescription className="text-sm font-['Pretendard'] text-white/60 mt-2">
              수고하셨습니다
            </DialogDescription>
          </DialogHeader>

          {summary && (
            <div className="space-y-6 py-6">
              {/* 점수 요약 */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-white/5 border border-white/10">
                  <div className="text-xs font-['Pretendard'] text-white/60 uppercase tracking-wider mb-2">Total</div>
                  <div className="text-2xl font-['Inter'] font-bold text-white">{summary.summary.totalQuestions}</div>
                </div>
                <div className="p-4 bg-[#B5A6E0]/10 border border-[#B5A6E0]/30">
                  <div className="text-xs font-['Pretendard'] text-white/60 uppercase tracking-wider mb-2">Correct</div>
                  <div className="text-2xl font-['Inter'] font-bold text-[#B5A6E0]">{summary.summary.correctAnswers}</div>
                </div>
                <div className="p-4 bg-[#4B2199]/10 border border-[#4B2199]/30">
                  <div className="text-xs font-['Pretendard'] text-white/60 uppercase tracking-wider mb-2">Score</div>
                  <div className="text-2xl font-['Inter'] font-bold text-white">{summary.summary.totalScore}</div>
                </div>
              </div>

              {/* 문제별 결과 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-[#4B2199]"></div>
                  <span className="text-sm font-['Pretendard'] font-semibold text-white/80 uppercase tracking-wider">Details</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {summary.results.map((r, index) => (
                    <div key={r.dictationResultId} className="p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-['Pretendard'] font-medium text-white">
                          문제 {index + 1}
                        </span>
                        <span className={`text-xs font-['Pretendard'] font-semibold px-3 py-1 ${
                          r.isCorrect
                            ? 'bg-[#B5A6E0]/20 text-[#B5A6E0] border border-[#B5A6E0]/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {r.isCorrect ? "CORRECT" : "WRONG"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex gap-2 text-xs">
                          <span className="text-white/40 font-['Pretendard']">입력:</span>
                          <span className="text-white/70 font-['Inter']">{r.meta.userAnswer || "(빈 답안)"}</span>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <span className="text-white/40 font-['Pretendard']">정답:</span>
                          <span className="text-[#B5A6E0]/80 font-['Inter']">{r.meta.correctAnswer}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-white/10 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpenSummary(false)}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 font-['Pretendard'] font-medium"
            >
              닫기
            </Button>
            <Button
              onClick={goSong}
              className="bg-[#4B2199] hover:bg-[#4B2199]/80 text-white font-['Pretendard'] font-medium border-0"
            >
              곡으로 돌아가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
