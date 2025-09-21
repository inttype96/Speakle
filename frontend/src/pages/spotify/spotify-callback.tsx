import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SpotifyCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');


    if (error) {
      setStatus('error');
      setMessage(`Spotify 연동이 취소되었습니다: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('올바르지 않은 응답입니다. 다시 시도해주세요.');
      return;
    }

    // 성공적으로 code를 받았으면 백엔드가 자동으로 처리할 것임
    setStatus('success');
    setMessage('Spotify 계정이 성공적으로 연동되었습니다!');

    // 3초 후 마이페이지로 이동 (연동 완료 파라미터 포함)
    setTimeout(() => {
      navigate('/mypage?spotify_connected=true');
    }, 3000);
  }, [searchParams, navigate]);

  const handleGoHome = () => {
    if (status === 'success') {
      navigate('/mypage?spotify_connected=true');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {status === 'loading' && '🔄 처리 중...'}
              {status === 'success' && '🎉 연동 완료!'}
              {status === 'error' && '❌ 연동 실패'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              {status === 'loading' && 'Spotify 연동을 처리하고 있습니다...'}
              {message}
            </p>

            {status === 'success' && (
              <p className="text-sm text-muted-foreground mb-4">
                잠시 후 마이페이지로 이동합니다.
              </p>
            )}

            {(status === 'error' || status === 'success') && (
              <Button onClick={handleGoHome} className="w-full">
                메인 페이지로 이동
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}