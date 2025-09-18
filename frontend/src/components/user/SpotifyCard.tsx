import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SpotifyStatusResponse, SpotifyProfileResponse } from '@/services/spotify'

interface SpotifyCardProps {
  spotifyStatus: SpotifyStatusResponse['data'] | null
  spotifyProfile: SpotifyProfileResponse['data'] | null
  onManageClick: () => void
}

export default function SpotifyCard({ spotifyStatus, spotifyProfile, onManageClick }: SpotifyCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎵</span>
          Spotify 연동
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-medium">연동 상태</p>
                <Badge
                  variant={spotifyStatus?.connected ? "default" : "secondary"}
                  className={spotifyStatus?.connected ? "bg-green-500 text-white" : ""}
                >
                  {spotifyStatus?.connected ? '연동됨' : '연동 안됨'}
                </Badge>
              </div>
              {spotifyStatus?.connected && spotifyProfile && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-1 p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">계정명:</span>
                      <span className="text-sm font-medium">
                        {spotifyProfile.display_name || spotifyProfile.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">이메일:</span>
                      <span className="text-sm">{spotifyProfile.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">국가:</span>
                      <span className="text-sm">{spotifyProfile.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">사용자 ID:</span>
                      <span className="text-sm font-mono text-xs">{spotifyProfile.id}</span>
                    </div>
                  </div>
                  {spotifyStatus.expiresAtEpochSec && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">토큰 만료:</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(spotifyStatus.expiresAtEpochSec * 1000).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                  {spotifyStatus.scope && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">권한:</span>
                      <span className="text-xs text-muted-foreground">
                        {spotifyStatus.scope.split(' ').join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {!spotifyStatus?.connected && (
                <p className="text-sm text-muted-foreground">
                  음악 기반 학습을 위한 Spotify 계정 연동
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onManageClick}
            >
              {spotifyStatus?.connected ? '관리' : '연동하기'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}