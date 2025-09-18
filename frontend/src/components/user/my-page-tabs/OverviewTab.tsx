import ProfileCard from '@/components/user/ProfileCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { UserProfile } from '@/types/auth'
import type {
  PointProfile,
  Playlist,
  LearnedSong,
  CheckinResponse
} from '@/services/mypage'
import TwoColumnTabLayout from './TwoColumnTabLayout'

interface OverviewTabProps {
  profile: UserProfile
  checkinInfo: CheckinResponse['data'] | null
  checkinError: boolean
  onEditClick: () => void
  onCheckinClick: () => void
  recentSongs: LearnedSong[]
  playlists: Playlist[]
  pointProfile: PointProfile | null
}

export default function OverviewTab({
  profile,
  checkinInfo,
  checkinError,
  onEditClick,
  onCheckinClick,
  recentSongs,
  playlists,
  pointProfile
}: OverviewTabProps) {
  return (
    <TwoColumnTabLayout
      left={
        <ProfileCard
          profile={profile}
          checkinInfo={checkinInfo}
          checkinError={checkinError}
          onEditClick={onEditClick}
          onCheckinClick={onCheckinClick}
        />
      }
      right={
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span>
              학습 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-primary">{recentSongs.length}</div>
                <div className="text-sm text-muted-foreground">학습한 곡</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-primary">{playlists.length}</div>
                <div className="text-sm text-muted-foreground">내 플레이리스트</div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">현재 포인트</div>
              <div className="text-lg font-semibold text-yellow-600">
                {pointProfile ? `${pointProfile.balance}P` : '로딩 중...'}
              </div>
            </div>
          </CardContent>
        </Card>
      }
    />
  )
}