import ProfileCard from '@/components/user/ProfileCard'
import RecentSongsCard from '@/components/user/RecentSongsCard'
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
  recentSongsError: boolean
}

export default function OverviewTab({
  profile,
  checkinInfo,
  checkinError,
  onEditClick,
  onCheckinClick,
  recentSongs,
  playlists,
  pointProfile,
  recentSongsError
}: OverviewTabProps) {
  return (
    <div className="w-full space-y-6">
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

      {/* 학습 관리 섹션 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">학습 관리</h2>
        <TwoColumnTabLayout
          left={<RecentSongsCard recentSongs={recentSongs} error={recentSongsError} />}
          right={
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📈</span>
                  학습 통계
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                <div className="space-y-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-primary">{recentSongs.length}</div>
                    <div className="text-sm text-muted-foreground">학습 완료</div>
                  </div>
                  <Separator />
                  <div className="text-sm text-muted-foreground text-center">
                    최근 학습한 곡들을 통해 실력을 향상시키세요!
                  </div>
                </div>
              </CardContent>
            </Card>
          }
        />
      </div>
    </div>
  )
}