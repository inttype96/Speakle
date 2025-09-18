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
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    계정: {spotifyProfile.display_name || spotifyProfile.id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    이메일: {spotifyProfile.email}
                  </p>
                  {spotifyStatus.expiresAtEpochSec && (
                    <p className="text-sm text-muted-foreground">
                      토큰 만료: {new Date(spotifyStatus.expiresAtEpochSec * 1000).toLocaleString('ko-KR')}
                    </p>
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