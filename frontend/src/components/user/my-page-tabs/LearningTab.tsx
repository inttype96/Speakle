import RecentSongsCard from '@/components/user/RecentSongsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { LearnedSong } from '@/services/mypage'
import TwoColumnTabLayout from './TwoColumnTabLayout'

interface LearningTabProps {
  recentSongs: LearnedSong[]
  error: boolean
}

export default function LearningTab({ recentSongs, error }: LearningTabProps) {
  return (
    <TwoColumnTabLayout
      left={<RecentSongsCard recentSongs={recentSongs} error={error} />}
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
  )
}