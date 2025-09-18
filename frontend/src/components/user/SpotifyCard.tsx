import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { SpotifyStatusResponse, SpotifyProfileResponse } from '@/services/spotify'

interface SpotifyCardProps {
  spotifyStatus: SpotifyStatusResponse | null
  spotifyProfile: SpotifyProfileResponse | null
  onConnect: () => void
  onDisconnect: () => void
}

export default function SpotifyCard({
  spotifyStatus,
  spotifyProfile,
  onConnect,
  onDisconnect
}: SpotifyCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎵</span>
          Spotify 연동 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        {/* 연결 상태 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">연동 상태:</span>
                <Badge
                  variant={spotifyStatus?.connected ? "default" : "secondary"}
                  className={spotifyStatus?.connected ? "bg-green-500 text-white" : ""}
                >
                  {spotifyStatus?.connected ? '연동됨' : '연동 안됨'}
                </Badge>
              </div>
            </div>
            <Button
              variant={spotifyStatus?.connected ? "destructive" : "default"}
              size="sm"
              onClick={spotifyStatus?.connected ? onDisconnect : onConnect}
            >
              {spotifyStatus?.connected ? '연동 해제' : '연동하기'}
            </Button>
          </div>
        </div>

        {/* 사용자 정보 */}
        {spotifyStatus?.connected && spotifyProfile && (
          <div className="space-y-4">
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3">사용자 정보</h3>
              <div className="grid grid-cols-1 gap-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">계정명:</span>
                  <span className="text-sm font-medium">
                    {spotifyProfile.displayName || spotifyProfile.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">이메일:</span>
                  <span className="text-sm">{spotifyProfile.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">국가:</span>
                  <span className="text-sm">{spotifyProfile.country}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">사용자 ID:</span>
                  <span className="text-sm font-mono">{spotifyProfile.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 연동 상세 정보 */}
        {spotifyStatus?.connected && (
          <div className="space-y-4">
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-3">연동 정보</h3>
              <div className="space-y-3">
                {spotifyStatus.expiresAtEpochSec && (
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                    <span className="text-sm font-medium text-muted-foreground">토큰 만료:</span>
                    <span className="text-sm">
                      {new Date(spotifyStatus.expiresAtEpochSec * 1000).toLocaleString('ko-KR')}
                    </span>
                  </div>
                )}
                {spotifyStatus.scope && (
                  <div className="p-3 bg-muted/20 rounded-md">
                    <div className="text-sm font-medium text-muted-foreground mb-2">권한:</div>
                    <div className="text-sm">
                      {spotifyStatus.scope.split(' ').map((scope, index) => (
                        <Badge key={index} variant="outline" className="mr-1 mb-1">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!spotifyStatus?.connected && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Spotify와 연동하여 더 많은 음악으로 학습하세요.
            </p>
            <p className="text-sm text-muted-foreground">
              연동 후 음악 재생, 플레이리스트 접근 등의 기능을 사용할 수 있습니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
