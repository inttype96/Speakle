import PointRankingCard from '@/components/user/PointRankingCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { RankingUser, PointProfile } from '@/services/mypage'
import TwoColumnTabLayout from './TwoColumnTabLayout'

interface RankingTabProps {
  ranking: RankingUser[]
  error: boolean
  pointProfile: PointProfile | null
}

export default function RankingTab({ ranking, error, pointProfile }: RankingTabProps) {
  return (
    <TwoColumnTabLayout
      left={<PointRankingCard ranking={ranking} error={error} />}
      right={
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🏅</span>
              내 순위 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-primary">
                  {pointProfile ? pointProfile.balance : '0'}P
                </div>
                <div className="text-sm text-muted-foreground">내 포인트</div>
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground text-center">
                더 많이 학습하고 상위 랭킹에 도전하세요!
              </div>
            </div>
          </CardContent>
        </Card>
      }
    />
  )
}