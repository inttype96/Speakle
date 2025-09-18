import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RankingUser } from '@/services/mypage'

interface PointRankingCardProps {
  ranking: RankingUser[]
  error?: boolean
}

export default function PointRankingCard({ ranking, error }: PointRankingCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🏆</span>
          포인트 랭킹 (TOP 5)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {error ? (
            <div className="text-center text-muted-foreground py-4">
              <p>랭킹 정보를 불러올 수 없습니다.</p>
              <p className="text-sm">서버에 일시적인 문제가 있을 수 있습니다.</p>
            </div>
          ) : ranking.length > 0 ? (
            ranking.map((user) => (
              <div key={user.userId} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                  {user.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-medium">{user.username.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-yellow-600">{user.points}P</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">랭킹 정보를 불러오는 중...</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}