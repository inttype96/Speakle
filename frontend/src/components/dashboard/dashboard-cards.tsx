import { Button } from '@/components/ui/button'
import { BentoCard } from '@/components/ui/bento-card'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { LearnedSong } from '@/services/mypage'
import {
  TrendingUp,
  Music,
  Star,
  Zap,
  Trophy,
  BookOpen,
  Headphones
} from 'lucide-react'

interface StreakCardProps {
  currentStreak: number
  isCheckedIn: boolean
}

export function StreakCard({
  currentStreak,
  isCheckedIn
}: StreakCardProps) {
  const weekDays = ['월', '화', '수', '목', '금', '토', '일']

  // 현재 요일 구하기 (0: 일요일 -> 6: 일요일로 변환)
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1 // 월요일을 0으로 시작하도록 변환

  // 이번 주에 출석한 날들을 계산 (연속성에 관계없이 이번 주 출석 기록)
  const getAttendedDaysInWeek = () => {
    const attendedDays = new Set()

    // 현재 요일부터 시작해서 연속 출석일만큼 역산
    // 하지만 일주일 범위 내에서만 표시
    if (currentStreak > 0) {
      // 오늘이 출석한 날이라면 오늘 포함
      if (isCheckedIn) {
        attendedDays.add(todayIndex)
      }

      // 연속 출석 기간 내의 날들을 이번 주 범위에서 표시
      // 최대 7일, 오늘부터 역산하되 이번 주 월~일 범위에서만
      for (let i = 1; i < currentStreak && i < 7; i++) {
        const dayIndex = (todayIndex - i + 7) % 7
        attendedDays.add(dayIndex)
      }
    }

    return attendedDays
  }

  const attendedDays = getAttendedDaysInWeek()

  return (
    <BentoCard
      className="md:col-span-2 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800"
      hover={false}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-full">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold">{currentStreak}일 연속 출석</h3>
        </div>
        <div className="text-3xl">🔥</div>
      </div>

      <div className="flex justify-center items-center gap-3">
        {weekDays.map((day, index) => {
          const isAttended = attendedDays.has(index)
          const isToday = index === todayIndex

          return (
            <div key={day} className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isAttended
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                } ${isToday ? 'ring-2 ring-orange-300' : ''}`}
              >
                {isToday && isAttended ? (
                  <span className="drop-shadow-sm" style={{ textShadow: '0 0 2px white, 0 0 4px white' }}>🔥</span>
                ) : isAttended ? '✓' : ''}
              </div>
              <span className={`text-xs ${isToday ? 'font-bold text-orange-600' : 'text-muted-foreground'}`}>
                {day}
              </span>
            </div>
          )
        })}
      </div>
    </BentoCard>
  )
}

interface PointsCardProps {
  balance: number
  level: string
}

export function PointsCard({ balance, level }: PointsCardProps) {
  return (
    <BentoCard className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500 rounded-full">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold">포인트</h3>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-yellow-600 mb-2">
          {balance.toLocaleString()}P
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
          <Star className="w-4 h-4 text-yellow-600 mr-1" />
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
            레벨 {level}
          </span>
        </div>
      </div>
    </BentoCard>
  )
}

export function ExploreCard() {
  const navigate = useNavigate()

  return (
    <BentoCard
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800"
      onClick={() => navigate('/explore')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-full">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold">학습 시작</h3>
        </div>
      </div>

      <p className="text-muted-foreground mb-4 text-sm">
        새로운 곡으로 영어 학습을 시작해보세요
      </p>

      <Button className="w-full bg-blue-500 hover:bg-blue-600">
        <Headphones className="w-4 h-4 mr-2" />
        학습 더 하러가기
      </Button>
    </BentoCard>
  )
}

interface RecentSongsCardProps {
  recentSongs: LearnedSong[]
  error: boolean
}

export function RecentSongsCard({ recentSongs, error }: RecentSongsCardProps) {
  const navigate = useNavigate()

  return (
    <BentoCard className="md:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500 rounded-full">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold">최근 학습한 곡</h3>
        </div>
      </div>

      {error ? (
        <div className="text-center text-muted-foreground py-8">
          <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>최근 학습 정보를 불러올 수 없습니다.</p>
        </div>
      ) : recentSongs.length > 0 ? (
        <div className="space-y-3">
          {recentSongs.slice(0, 3).map((song, index) => (
            <div
              key={song.learnedSongId || index}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-green-900/10 hover:bg-white/80 dark:hover:bg-green-900/20 transition-colors cursor-pointer"
              onClick={() => navigate(`/songs/${song.songId}`)}
            >
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center overflow-hidden">
                {song.albumImgUrl ? (
                  <img
                    src={song.albumImgUrl}
                    alt={song.album}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{song.title}</p>
                <p className="text-sm text-muted-foreground truncate">{song.artists}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(song.createdAt).toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="mb-4">아직 학습한 곡이 없습니다.</p>
          <Button
            variant="outline"
            onClick={() => navigate('/explore')}
            className="border-green-200 text-green-600 hover:bg-green-50"
          >
            첫 학습 시작하기
          </Button>
        </div>
      )}
    </BentoCard>
  )
}

interface RankingCardProps {
  ranking: any[]
  error: boolean
}

export function RankingCard({ ranking, error }: RankingCardProps) {
  return (
    <BentoCard className="md:col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500 rounded-full">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold">포인트 랭킹</h3>
        </div>
      </div>

      {error ? (
        <div className="text-center text-muted-foreground py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>랭킹 정보를 불러올 수 없습니다.</p>
        </div>
      ) : ranking.length > 0 ? (
        <div className="space-y-3">
          {ranking.slice(0, 5).map((user, index) => (
            <div
              key={user.userId}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-purple-900/10 hover:bg-white/80 dark:hover:bg-purple-900/20 transition-colors"
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                index === 0 && "bg-yellow-500",
                index === 1 && "bg-gray-400",
                index === 2 && "bg-amber-600",
                index > 2 && "bg-purple-500"
              )}>
                {user.rank}
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center overflow-hidden">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {user.username.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{user.username}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-purple-600">{user.points}P</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>랭킹 정보가 없습니다.</p>
        </div>
      )}
    </BentoCard>
  )
}