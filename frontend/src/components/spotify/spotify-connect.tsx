import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { connectSpotifyAPI } from "@/services/spotify";
import { useAuthStore } from "@/store/auth";
import { AxiosError } from "axios";

interface SpotifyConnectProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function SpotifyConnect({ onSuccess, onError, className }: SpotifyConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokens = useAuthStore((state) => state.tokens);
  const isAuthenticated = !!tokens?.accessToken;

  const handleSpotifyConnect = async () => {
    if (!isAuthenticated) {
      const errorMsg = '먼저 로그인해주세요!';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await connectSpotifyAPI();

      const redirectUrl = response.data?.redirectUrl;

      if (redirectUrl) {
        // Spotify 인증 페이지로 리다이렉트
        window.location.href = redirectUrl;
        onSuccess?.();
      } else {
        const errorMsg = '리다이렉트 URL을 받지 못했습니다.';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (error) {
      let errorMsg = '네트워크 오류가 발생했습니다.';

      if (error instanceof AxiosError && error.response) {
        const status = error.response.status;

        switch (status) {
          case 503:
            errorMsg = 'Spotify 서비스가 일시적으로 사용할 수 없습니다. 나중에 다시 시도해 주세요.';
            break;
          case 401:
            errorMsg = '인증에 실패했습니다. 로그아웃 후 다시 로그인해 주세요.';
            break;
          case 404:
            errorMsg = 'Spotify 연동 서비스를 찾을 수 없습니다.';
            break;
          case 500:
            // 백엔드 로그에서 "사용자 인증 정보가 필요합니다" 에러 확인됨
            if (error.response.data?.message?.includes('인증') || error.response.data?.message?.includes('사용자')) {
              errorMsg = '사용자 인증에 문제가 있습니다. 로그아웃 후 다시 로그인해 주세요.';
            } else {
              errorMsg = '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
            }
            break;
          default:
            errorMsg = error.response.data?.message || `Spotify 연결 실패 (${status})`;
        }
      } else if (error instanceof Error) {
        errorMsg = `네트워크 에러: ${error.message}`;
      }

      setError(errorMsg);
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

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

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