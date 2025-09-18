import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { UserProfile } from '@/types/auth'
import type { CheckinResponse } from '@/services/mypage'

interface ProfileCardProps {
  profile: UserProfile
  checkinInfo: CheckinResponse['data'] | null
  checkinError?: boolean
  onEditClick: () => void
  onCheckinClick: () => void
}

export default function ProfileCard({
  profile,
  checkinInfo,
  checkinError,
  onEditClick,
  onCheckinClick
}: ProfileCardProps) {

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>👤</span>
            프로필 정보
          </div>
          <Button onClick={onEditClick} variant="outline" size="sm">
            수정
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">이름</label>
                <p className="text-lg font-semibold">{profile.username}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">이메일</label>
                <p className="text-lg">{profile.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">연속 출석일</label>
                <p className="text-lg">
                  {checkinError ? '오류' : checkinInfo ? `${checkinInfo.currentStreak}일` : '로딩 중...'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={onCheckinClick} size="sm" disabled={checkinError}>
                  출석 체크
                </Button>
                {checkinError ? (
                  <span className="text-xs text-muted-foreground">
                    출석 정보 오류
                  </span>
                ) : checkinInfo ? (
                  <span className="text-sm text-muted-foreground">
                    총 {checkinInfo.totalDays}일 출석
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
}