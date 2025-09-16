import { SpotifyConnect } from "@/components/spotify/spotify-connect";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SpotifySetupPage() {
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

        <SpotifyConnect
          onSuccess={() => {
            console.log('Spotify 연결 성공');
          }}
          onError={(error) => {
            console.error('Spotify 연결 실패:', error);
          }}
          className="mb-6"
        />

        <div className="flex flex-col gap-3">
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