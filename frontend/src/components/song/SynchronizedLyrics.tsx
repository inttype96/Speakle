import { useEffect, useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface LyricChunk {
  id: string;
  startTimeMs: number;
  english: string;
  korean: string | null;
}

interface SynchronizedLyricsProps {
  lyricChunks: LyricChunk[];
  currentTime: number; // 현재 재생 시간 (밀리초)
  isPlaying?: boolean;
}

export default function SynchronizedLyrics({
  lyricChunks,
  currentTime
}: SynchronizedLyricsProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);

  // 빈 가사를 제외한 유효한 가사만 필터링
  const validLyrics = lyricChunks.filter(chunk => chunk.english && chunk.english.trim() !== '');

  console.log('🎵 SynchronizedLyrics Debug:');
  console.log('📝 Original lyricChunks:', lyricChunks);
  console.log('✅ Valid lyrics:', validLyrics);
  console.log('⏰ Current time:', currentTime);
  console.log('📍 Current line index:', currentLineIndex);

  // 현재 재생 시간에 따른 가사 라인 인덱스 계산
  useEffect(() => {
    if (!validLyrics.length) return;

    // 현재 시간보다 작거나 같은 startTimeMs 중 가장 큰 값의 인덱스 찾기
    let newIndex = -1;

    for (let i = 0; i < validLyrics.length; i++) {
      if (validLyrics[i].startTimeMs <= currentTime) {
        newIndex = i;
      } else {
        break;
      }
    }

    // 다음 라인이 있는 경우, 다음 라인의 시작 시간보다 현재 시간이 작은지 확인
    if (newIndex >= 0 && newIndex < validLyrics.length - 1) {
      const nextLine = validLyrics[newIndex + 1];
      if (currentTime >= nextLine.startTimeMs) {
        // 이미 다음 라인으로 넘어간 경우는 위의 루프에서 처리됨
      }
    }

    if (newIndex !== currentLineIndex) {
      console.log(`🔄 Line changed: ${currentLineIndex} -> ${newIndex}`);
      if (newIndex >= 0 && validLyrics[newIndex]) {
        console.log(`🎤 Current lyric: "${validLyrics[newIndex].english}"`);
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
                "transition-all duration-300 ease-in-out p-3 rounded-lg",
                isCurrent && [
                  "bg-primary/10 border-l-4 border-primary",
                  "transform scale-105 shadow-sm"
                ],
                isPast && "opacity-60",
                isFuture && "opacity-40"
              )}
            >
              {/* 영어 가사만 표시 */}
              <div className={cn(
                "text-base leading-relaxed transition-all duration-300",
                isCurrent && "text-primary font-semibold text-lg",
                isPast && "text-muted-foreground",
                isFuture && "text-foreground"
              )}>
                {chunk.english}
              </div>

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
  );
}

// 시간 포맷 유틸리티 함수
export const formatTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};