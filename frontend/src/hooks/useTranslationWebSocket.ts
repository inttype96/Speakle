import {useCallback, useEffect, useRef, useState} from 'react';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Vite 프록시를 통해 상대 경로로 연결 (프록시가 백엔드로 전달)
const WS_URL = '/ws-translation';

export interface TranslationUpdateEvent {
  songId: string;
  chunkId?: string;
  english?: string;
  korean?: string;
  startTimeMs?: number;
  totalChunks: number;
  completedChunks: number;
  status: 'STARTED' | 'PROGRESS' | 'COMPLETED' | 'ERROR';
}

interface UseTranslationWebSocketProps {
  songId: string;
  onTranslationUpdate?: (event: TranslationUpdateEvent) => void;
}

export const useTranslationWebSocket = ({
  songId,
  onTranslationUpdate
}: UseTranslationWebSocketProps) => {
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null); // STOMP 구독 객체 저장
  const [isConnected, setIsConnected] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({
    status: 'idle' as 'idle' | 'started' | 'progress' | 'completed' | 'error',
    totalChunks: 0,
    completedChunks: 0,
    progressPercentage: 0
  });

  const connect = useCallback(() => {
    if (clientRef.current?.connected) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      debug: (str) => {
        console.log('[WebSocket Debug]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setIsConnected(true);

      // 특정 곡의 번역 업데이트 구독
        // 구독 정리를 위해 저장
      subscriptionRef.current = client.subscribe(`/topic/translation/${songId}`, (message) => {
          try {
              const event: TranslationUpdateEvent = JSON.parse(message.body);

              // 진행률 업데이트
              const progressPercentage = event.totalChunks > 0
                  ? Math.round((event.completedChunks / event.totalChunks) * 100)
                  : 0;

              setTranslationProgress({
                  status: event.status.toLowerCase() as any,
                  totalChunks: event.totalChunks,
                  completedChunks: event.completedChunks,
                  progressPercentage
              });

              // 콜백 호출
              onTranslationUpdate?.(event);

          } catch (error) {
              console.error('[WebSocket] Failed to parse translation update:', error);
          }
      });
    };

    client.onStompError = (frame) => {
      console.error('[WebSocket] STOMP error:', frame.headers['message']);
      console.error('[WebSocket] Error details:', frame.body);
      setIsConnected(false);
    };

    client.onWebSocketClose = () => {
      setIsConnected(false);
    };

    client.onDisconnect = () => {
      setIsConnected(false);
    };

    clientRef.current = client;
    client.activate();
  }, [songId, onTranslationUpdate]);

  const disconnect = useCallback(() => {
    // 구독 해제
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    isConnected,
    translationProgress,
    connect,
    disconnect
  };
};
