import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { pausePlaybackAPI } from '@/services/spotify';

interface SpotifyPlayerContextType {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  shouldStopPlayer: boolean;
  setShouldStopPlayer: (stop: boolean) => void;
  currentTrackId: string | null;
  setCurrentTrackId: (trackId: string | null) => void;
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextType | undefined>(undefined);

interface SpotifyPlayerProviderProps {
  children: ReactNode;
}

export function SpotifyPlayerProvider({ children }: SpotifyPlayerProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldStopPlayer, setShouldStopPlayer] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const location = useLocation();
  const isPlayingRef = useRef(isPlaying);

  // ref 업데이트
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // shouldStopPlayer 상태 변화 로그
  useEffect(() => {
  }, [shouldStopPlayer]);

  // 페이지 변경 감지 - 음악 재생 허용 페이지가 아니면 플레이어 정지
  useEffect(() => {
    console.log('🔍 Current pathname:', location.pathname);
    const isSongDetailPage = location.pathname.startsWith('/songs/');
    const isDictationPage = location.pathname.startsWith('/learn/dictation');
    const isIframePath = location.pathname.includes('/ws-translation/iframe.html');
    console.log('🔍 isSongDetailPage:', isSongDetailPage, 'isDictationPage:', isDictationPage, 'isIframePath:', isIframePath);

    // 음악 재생을 허용하는 페이지들
    const isMusicAllowedPage = isSongDetailPage || isDictationPage;

    // iframe 경로는 무시하고, 음악 허용 페이지가 아닐 때 즉시 정지
    if (!isMusicAllowedPage && !isIframePath) {
      // 현재 재생 중인지 확인 (ref와 state 둘 다 체크)
      const currentlyPlaying = isPlayingRef.current || isPlaying;

      if (currentlyPlaying) {
        pausePlaybackAPI()
          .then(() => {
            console.log('✅ Spotify pause API call successful');
          })
          .catch((error) => {
            console.error('❌ Spotify pause API call failed:', error);
          });

        // 즉시 전역 상태 업데이트
        setIsPlaying(false);
        setShouldStopPlayer(true);
      } else {
        console.log('ℹ️ Not on music allowed page, but player already stopped');
      }
    } else if (isMusicAllowedPage) {
      console.log('✅ On music allowed page, resetting stop signals');
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