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
  const validLyrics = lyricChunks
    .filter(chunk => {
      if (!chunk.english || chunk.english.trim() === '') return false;

      // 음악 기호나 의미 없는 텍스트 제외
      const text = chunk.english.trim();
      if (text === '♪' || text === '♫' || text === '🎵' || text === '🎶') return false;
      if (text.length <= 2 && /^[♪♫🎵🎶\-_~\s]*$/.test(text)) return false;

      return true;
    })
    // 중복 제거 (같은 시간대의 중복 가사 제거)
    .filter((chunk, index, array) => {
      const prevChunk = array[index - 1];
      if (prevChunk &&
          chunk.english === prevChunk.english &&
          Math.abs(chunk.startTimeMs - prevChunk.startTimeMs) < 5000) {
        return false; // 같은 가사이고 5초 이내 차이면 제거
      }
      return true;
    });

  console.log('🎵 SynchronizedLyrics Debug:');
  console.log('📝 Original lyricChunks:', lyricChunks);
  console.log('✅ Valid lyrics:', validLyrics);
  console.log('⏰ Current time:', currentTime);
  console.log('📍 Current line index:', currentLineIndex);

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
              {/* 영어 가사만 표시 */}
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