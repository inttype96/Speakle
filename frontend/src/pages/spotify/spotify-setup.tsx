import { SpotifyConnect } from "@/components/spotify/spotify-connect";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";

export default function SpotifySetupPage() {
  const logout = useAuthStore((state) => state.logout);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [isAuthError, setIsAuthError] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">🎉 회원가입 완료!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Speakle에 오신 것을 환영합니다!
            </p>
            <p className="text-sm text-muted-foreground">
              음악과 함께하는 영어 학습을 위해 Spotify 계정을 연동해보세요.
            </p>
          </CardContent>
        </Card>

        {!showFallback ? (
          <SpotifyConnect
            onSuccess={() => {
              console.log('Spotify 연결 성공');
            }}
            onError={(error) => {
              console.error('Spotify 연결 실패:', error);
              setSpotifyError(error);
              // 503 또는 서비스 unavailable 에러인 경우 fallback UI 표시
              if (error.includes('일시적으로 사용할 수 없습니다') || error.includes('503')) {
                setShowFallback(true);
              }
              // 인증 관련 에러인 경우 auth error 플래그 설정
              if (error.includes('인증') || error.includes('로그아웃') || error.includes('401') || error.includes('500')) {
                setIsAuthError(true);
              }
            }}
            className="mb-6"
          />
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                ⚠️ Spotify 연동 일시 중단
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                현재 Spotify 연동 서비스가 일시적으로 사용할 수 없습니다.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                서비스가 복구되면 마이페이지나 설정에서 언제든지 Spotify 계정을 연동하실 수 있습니다.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowFallback(false)}
                  variant="outline"
                  size="sm"
                >
                  다시 시도
                </Button>
              </div>
              {spotifyError && (
                <p className="text-xs text-muted-foreground mt-2">
                  오류: {spotifyError}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {isAuthError && (
            <Button onClick={handleLogout} className="w-full bg-destructive hover:bg-destructive/90">
              로그아웃 후 다시 로그인
            </Button>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link to="/">
              나중에 연동하기
            </Link>
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Spotify 연동은 언제든지 설정에서 할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}