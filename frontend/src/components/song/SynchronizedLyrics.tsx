import { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTranslationWebSocket, type TranslationUpdateEvent } from '@/hooks/useTranslationWebSocket';

interface LyricChunk {
  id: string;
  startTimeMs: number;
  english: string;
  korean: string | null;
}

interface SynchronizedLyricsProps {
  songId: string; // 실시간 번역을 위한 songId
  lyricChunks: LyricChunk[];
  currentTime: number; // 현재 재생 시간 (밀리초)
  isPlaying?: boolean;
}

export default function SynchronizedLyrics({
  songId,
  lyricChunks,
  currentTime
}: SynchronizedLyricsProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [realtimeLyrics, setRealtimeLyrics] = useState<LyricChunk[]>(lyricChunks);
  const [showTranslationProgress, setShowTranslationProgress] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);

  // 실시간 번역 WebSocket 연결
  const handleTranslationUpdate = useCallback((event: TranslationUpdateEvent) => {
    console.log('🔄 Translation update received:', event);

    if (event.status === 'STARTED') {
      setShowTranslationProgress(true);
    } else if (event.status === 'PROGRESS' && event.chunkId && event.korean) {
      // 해당 청크의 한국어 번역 업데이트
      setRealtimeLyrics(prev => prev.map(chunk =>
        chunk.id === event.chunkId
          ? { ...chunk, korean: event.korean || null }
          : chunk
      ));
    } else if (event.status === 'COMPLETED') {
      setShowTranslationProgress(false);
      console.log('✅ Translation completed!');
    } else if (event.status === 'ERROR') {
      setShowTranslationProgress(false);
      console.error('❌ Translation failed');
    }
  }, []);

  const { isConnected, translationProgress } = useTranslationWebSocket({
    songId,
    onTranslationUpdate: handleTranslationUpdate
  });

  // lyricChunks가 변경되면 realtimeLyrics 업데이트
  useEffect(() => {
    setRealtimeLyrics(lyricChunks);
  }, [lyricChunks]);

  // 빈 가사를 제외한 유효한 가사만 필터링
  const validLyrics = realtimeLyrics
    .filter(chunk => {
      if (!chunk.english || chunk.english.trim() === '') return false;

      // 음악 기호나 의미 없는 텍스트 제외
      const text = chunk.english.trim();
      if (text === '♪' || text === '♫' || text === '🎵' || text === '🎶') return false;
      return !(text.length <= 2 && /^[♪♫🎵🎶\-_~\s]*$/.test(text));


    })
    // 중복 제거 (같은 시간대의 중복 가사 제거)
    .filter((chunk, index, array) => {
      const prevChunk = array[index - 1];
      return !(prevChunk &&
          chunk.english === prevChunk.english &&
          Math.abs(chunk.startTimeMs - prevChunk.startTimeMs) < 5000);
    });

  // 현재 재생 시간에 따른 가사 라인 인덱스 계산
  useEffect(() => {
    if (!validLyrics.length) return;

    // 현재 시간과 가장 적절한 가사 라인 찾기
    let newIndex = -1;

    // 현재 시간보다 작거나 같은 startTimeMs를 가진 가사들 중에서
    // 가장 나중의 가사를 찾기
    for (let i = 0; i < validLyrics.length; i++) {
      const currentLyric = validLyrics[i];
      const nextLyric = validLyrics[i + 1];

      if (currentTime >= currentLyric.startTimeMs) {
        // 다음 가사가 없거나, 다음 가사 시작 시간보다 현재 시간이 작으면
        if (!nextLyric || currentTime < nextLyric.startTimeMs) {
          newIndex = i;
          break;
        } else {
          // 다음 가사가 있고 현재 시간이 다음 가사 시간을 넘었으면 계속 진행
          newIndex = i;
        }
      } else {
        // 현재 시간이 이 가사 시작 시간보다 작으면 중단
        break;
      }
    }

    if (newIndex !== currentLineIndex) {
      console.log(`🔄 Line changed: ${currentLineIndex} -> ${newIndex}`);
      console.log(`⏰ Current time: ${Math.floor(currentTime / 1000)}s`);
      if (newIndex >= 0 && validLyrics[newIndex]) {
        console.log(`🎤 Current lyric: "${validLyrics[newIndex].english}" (starts at ${Math.floor(validLyrics[newIndex].startTimeMs / 1000)}s)`);
      }
      setCurrentLineIndex(newIndex);
    }
  }, [currentTime, validLyrics, currentLineIndex]);

  // 현재 라인이 변경될 때 스크롤 조정
  useEffect(() => {
    if (currentLineIndex >= 0 && currentLineRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        const lineElement = currentLineRef.current;
        const containerRect = scrollContainer.getBoundingClientRect();
        const lineRect = lineElement.getBoundingClientRect();

        // 현재 라인이 보이는 영역 밖에 있으면 스크롤
        if (lineRect.top < containerRect.top || lineRect.bottom > containerRect.bottom) {
          const scrollTop = lineElement.offsetTop - scrollContainer.clientHeight / 2;
          scrollContainer.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentLineIndex]);

  if (!validLyrics.length) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <p>가사를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      {/* 번역 진행 상황 표시 */}
      {showTranslationProgress && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">실시간 번역 중...</span>
            <span className="text-sm text-muted-foreground">
              {translationProgress.completedChunks}/{translationProgress.totalChunks}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${translationProgress.progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* WebSocket 연결 상태 (디버그용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2 text-xs text-muted-foreground">
          WebSocket: {isConnected ? '🟢 연결됨' : '🔴 연결 안됨'}
        </div>
      )}

      <ScrollArea ref={scrollAreaRef} className="h-[60vh] pr-3">
        <div className="space-y-6 py-4">
          {validLyrics.map((chunk, index) => {
            const isCurrent = index === currentLineIndex;
            const isPast = index < currentLineIndex;
            const isFuture = index > currentLineIndex;

            return (
              <div
                key={chunk.id}
                ref={isCurrent ? currentLineRef : undefined}
                className={cn(
                  "transition-all duration-500 ease-in-out p-4 rounded-lg cursor-pointer",
                  "hover:bg-muted/50",
                  isCurrent && [
                    "bg-primary/15 border-l-4 border-primary",
                    "transform scale-105 shadow-md",
                    "ring-2 ring-primary/20"
                  ],
                  isPast && "opacity-50",
                  isFuture && "opacity-70"
                )}
              >
                {/* 영어 가사 */}
                <div className={cn(
                  "text-base leading-relaxed transition-all duration-500",
                  isCurrent && [
                    "text-primary font-bold text-xl",
                    "text-shadow-sm"
                  ],
                  isPast && "text-muted-foreground font-normal",
                  isFuture && "text-foreground/80 font-medium"
                )}>
                  {chunk.english}
                </div>

                {/* 한국어 번역 */}
                {chunk.korean && (
                  <div className={cn(
                    "mt-2 text-sm leading-relaxed transition-all duration-500",
                    isCurrent && [
                      "text-primary/80 font-medium text-base",
                      "opacity-90"
                    ],
                    isPast && "text-muted-foreground/60",
                    isFuture && "text-muted-foreground/70"
                  )}>
                    {chunk.korean}
                  </div>
                )}

                {/* 번역 중 표시 */}
                {!chunk.korean && showTranslationProgress && (
                  <div className="mt-2 text-xs text-muted-foreground/50 italic">
                    번역 중...
                  </div>
                )}

                {/* 타임스탬프 (디버그용 - 필요시 제거) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-muted-foreground/50 mt-1">
                    {Math.floor(chunk.startTimeMs / 1000)}s
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// 시간 포맷 유틸리티 함수
export const formatTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
