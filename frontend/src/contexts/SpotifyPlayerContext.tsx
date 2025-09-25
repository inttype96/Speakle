import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface SpotifyPlayerContextType {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  shouldStopPlayer: boolean;
  setShouldStopPlayer: (stop: boolean) => void;
  currentTrackId: string | null;
  setCurrentTrackId: (trackId: string | null) => void;
  stopSignal: number; // 정지 신호용 카운터
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextType | undefined>(undefined);

interface SpotifyPlayerProviderProps {
  children: ReactNode;
}

export function SpotifyPlayerProvider({ children }: SpotifyPlayerProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldStopPlayer, setShouldStopPlayer] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [stopSignal, setStopSignal] = useState(0);
  const location = useLocation();
  const isPlayingRef = useRef(isPlaying);

  // ref 업데이트
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    console.log('📱 Global isPlaying updated:', isPlaying);
  }, [isPlaying]);

  // shouldStopPlayer 상태 변화 로그
  useEffect(() => {
    console.log('🛑 Global shouldStopPlayer updated:', shouldStopPlayer);
  }, [shouldStopPlayer]);

  // 페이지 변경 감지 - SongDetail 페이지가 아니면 플레이어 정지
  useEffect(() => {
    const isSongDetailPage = location.pathname.startsWith('/songs/');
    const isIframePath = location.pathname.includes('/ws-translation/iframe.html');

    console.log('🔍 Page Detection:', {
      pathname: location.pathname,
      isSongDetailPage,
      isIframePath,
      isPlaying: isPlayingRef.current,
      currentIsPlaying: isPlaying
    });

    // iframe 경로는 무시하고, song detail 페이지가 아닐 때 즉시 정지
    if (!isSongDetailPage && !isIframePath) {
      // 현재 재생 중인지 확인 (ref와 state 둘 다 체크)
      const currentlyPlaying = isPlayingRef.current || isPlaying;

      console.log('🛑 Not on song detail page, checking if need to stop:', {
        currentlyPlaying,
        refPlaying: isPlayingRef.current,
        statePlaying: isPlaying
      });

      if (currentlyPlaying) {
        console.log('🛑 STOPPING PLAYER - Not on song detail page');
        // 즉시 전역 상태 업데이트 (동기적으로)
        setIsPlaying(false);
        setShouldStopPlayer(true);
        setStopSignal(prev => {
          const newSignal = prev + 1;
          console.log('🔢 Stop signal incremented:', prev, '->', newSignal);
          return newSignal;
        });
      } else {
        console.log('ℹ️ Not on song detail page, but player already stopped');
      }
    } else if (isSongDetailPage) {
      // Song detail 페이지에 있으면 정지 신호 리셋
      console.log('✅ On song detail page, resetting stop signals');
      setShouldStopPlayer(false);
    } else {
      console.log('🔍 Page change ignored (iframe or other)');
    }
  }, [location.pathname, isPlaying]);

  // 브라우저 이벤트들 처리
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isPlayingRef.current) {
        setShouldStopPlayer(true);
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isPlayingRef.current) {
        setShouldStopPlayer(true);
      }
    };

    const handlePageHide = () => {
      if (isPlayingRef.current) {
        setShouldStopPlayer(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  const contextValue: SpotifyPlayerContextType = {
    isPlaying,
    setIsPlaying,
    shouldStopPlayer,
    setShouldStopPlayer,
    currentTrackId,
    setCurrentTrackId,
    stopSignal,
  };

  return (
    <SpotifyPlayerContext.Provider value={contextValue}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
}

export function useSpotifyPlayer() {
  const context = useContext(SpotifyPlayerContext);
  if (context === undefined) {
    throw new Error('useSpotifyPlayer must be used within a SpotifyPlayerProvider');
  }
  return context;
}