import SpotifyCard from '@/components/user/SpotifyCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type {
  SpotifyStatusResponse,
  SpotifyProfileResponse
} from '@/services/spotify'
import TwoColumnTabLayout from './TwoColumnTabLayout'

interface SpotifyTabProps {
  spotifyStatus: SpotifyStatusResponse['data'] | null
  spotifyProfile: SpotifyProfileResponse['data'] | null
  onManageClick: () => void
}

export default function SpotifyTab({
  spotifyStatus,
  spotifyProfile,
  onManageClick
}: SpotifyTabProps) {
  return (
    <TwoColumnTabLayout
      left={
        <SpotifyCard
          spotifyStatus={spotifyStatus}
          spotifyProfile={spotifyProfile}
          onManageClick={onManageClick}
        />
      }
      right={
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎵</span>
              음악 스트리밍
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-primary">
                  {spotifyStatus?.connected ? '연동됨' : '미연동'}
                </div>
                <div className="text-sm text-muted-foreground">연동 상태</div>
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground text-center">
                Spotify와 연동하여 더 많은 음악으로 학습하세요.
              </div>
            </div>
          </CardContent>
        </Card>
      }
    />
  )
}