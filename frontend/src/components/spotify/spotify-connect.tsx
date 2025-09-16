import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { connectSpotifyAPI } from "@/services/spotify";
import { useAuthStore, getAccessToken } from "@/store/auth";
import { AxiosError } from "axios";

interface SpotifyConnectProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function SpotifyConnect({ onSuccess, onError, className }: SpotifyConnectProps) {
  const [loading, setLoading] = useState(false);
  const tokens = useAuthStore((state) => state.tokens);
  const isAuthenticated = !!tokens?.accessToken;

  const handleSpotifyConnect = async () => {
    if (!isAuthenticated) {
      alert('먼저 로그인해주세요!');
      return;
    }

    const token = getAccessToken();
    console.log('Spotify 연결 시도 - 토큰:', token ? `${token.substring(0, 20)}...` : 'null');

    setLoading(true);

    try {
      const response = await connectSpotifyAPI();

      console.log('Spotify 연결 응답:', response);

      if (response.data?.data?.redirectUrl) {
        // Spotify 인증 페이지로 리다이렉트
        window.location.href = response.data.data.redirectUrl;
        onSuccess?.();
      } else {
        const errorMsg = '리다이렉트 URL을 받지 못했습니다.';
        alert(errorMsg);
        onError?.(errorMsg);
      }
    } catch (error) {
      let errorMsg = '네트워크 오류가 발생했습니다.';

      if (error instanceof AxiosError && error.response) {
        errorMsg = error.response.data?.message || `Spotify 연결 실패: ${error.response.statusText}`;
      } else if (error instanceof Error) {
        errorMsg = `네트워크 에러: ${error.message}`;
      }

      console.error('Spotify 연결 오류:', error);
      alert(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎵 Spotify 연동
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Spotify와 연동하여 음악 기반 영어 학습을 시작하세요!
        </p>
        <Button
          onClick={handleSpotifyConnect}
          disabled={loading || !isAuthenticated}
          className="w-full bg-[#1db954] hover:bg-[#1ed760]"
          size="lg"
        >
          {loading ? '연결 중...' : 'Spotify와 연결하기'}
        </Button>
        {!isAuthenticated && (
          <p className="text-sm text-destructive mt-2">
            Spotify 연동을 위해서는 먼저 로그인이 필요합니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}