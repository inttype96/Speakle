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
      className="md:col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-lg"
      hover={false}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#4B2199]/80 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white font-['Pretendard']">{currentStreak}일 연속 출석</h3>
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
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                  isAttended
                    ? 'bg-[#4B2199]/80 text-white'
                    : 'bg-white/10 text-white/50'
                } ${isToday ? 'ring-2 ring-[#B5A6E0]/60' : ''}`}
              >
                {isToday && isAttended ? (
                  <span className="drop-shadow-sm" style={{ textShadow: '0 0 2px white, 0 0 4px white' }}>🔥</span>
                ) : isAttended ? '✓' : ''}
              </div>
              <span className={`text-xs font-['Pretendard'] ${isToday ? 'font-bold text-[#B5A6E0]' : 'text-white/60'}`}>
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
    <BentoCard className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#B5A6E0]/80 rounded-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white font-['Pretendard']">포인트</h3>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-3xl font-bold text-white mb-2 font-['Inter']">
          {balance.toLocaleString()}P
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-[#4B2199]/20 backdrop-blur-sm">
          <Star className="w-4 h-4 text-[#B5A6E0] mr-1" />
          <span className="text-sm font-medium text-[#B5A6E0] font-['Pretendard']">
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
      className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-lg cursor-pointer hover:bg-white/15 transition-all duration-300"
      onClick={() => navigate('/explore')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#4B2199]/80 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white font-['Pretendard']">학습 시작</h3>
        </div>
      </div>

      <p className="text-white/70 mb-4 text-sm font-['Pretendard']">
        새로운 곡으로 영어 학습을 시작해보세요
      </p>

      <Button className="w-full bg-[#4B2199]/90 hover:bg-[#4B2199] text-white font-['Pretendard'] font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
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

  // 최근 학습한 곡 클릭 핸들러
  const handleRecentSongClick = async (song: LearnedSong) => {
    try {
      // learnedSongId가 있는 경우에만 situation, location 조회
      if (song.learnedSongId) {
        const accessToken = localStorage.getItem("access_token") || undefined
        const { getLearnedSongInfo } = await import('@/services/songService')
        const learnedInfo = await getLearnedSongInfo(song.learnedSongId, accessToken)
        
        // situation, location이 있으면 쿼리 파라미터에 포함
        const params = new URLSearchParams()
        if (learnedInfo.situation) {
          params.set('situation', learnedInfo.situation)
        }
        if (learnedInfo.location) {
          params.set('location', learnedInfo.location)
        }
        
        const queryString = params.toString()
        const url = queryString ? `/songs/${song.songId}?${queryString}` : `/songs/${song.songId}`
        navigate(url)
      } else {
        // learnedSongId가 없으면 기본 동작
        navigate(`/songs/${song.songId}`)
      }
    } catch (error) {
      console.error('Failed to get learned song info:', error)
      // 에러 발생 시 기본 동작
      navigate(`/songs/${song.songId}`)
    }
  }

  return (
    <BentoCard className="md:col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#B5A6E0]/80 rounded-lg">
            <Music className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white font-['Pretendard']">최근 학습한 곡</h3>
        </div>
      </div>

      {error ? (
        <div className="text-center text-white/70 py-8">
          <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="font-['Pretendard']">최근 학습 정보를 불러올 수 없습니다.</p>
        </div>
      ) : recentSongs.length > 0 ? (
        <div className="space-y-3">
          {recentSongs.slice(0, 5).map((song, index) => (
            <div
              key={song.learnedSongId || index}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer backdrop-blur-sm"
              onClick={() => handleRecentSongClick(song)}
            >
              <div className="w-10 h-10 bg-[#4B2199]/20 rounded-lg flex items-center justify-center overflow-hidden">
                {song.albumImgUrl ? (
                  <img
                    src={song.albumImgUrl}
                    alt={song.album}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Music className="w-5 h-5 text-[#B5A6E0]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-white font-['Pretendard']">{song.title}</p>
                <p className="text-sm text-white/60 truncate font-['Pretendard']">{song.artists.replace(/[\[\]']/g, '')}</p>
              </div>
              <div className="text-sm text-white/50 font-['Pretendard']">
                {new Date(song.createdAt).toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-white/70 py-8">
          <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="mb-4 font-['Pretendard']">아직 학습한 곡이 없습니다.</p>
          <Button
            variant="outline"
            onClick={() => navigate('/explore')}
            className="border-white/30 text-white hover:bg-white/10 font-['Pretendard'] font-medium rounded-lg"
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
    <BentoCard className="md:col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#4B2199]/80 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white font-['Pretendard']">포인트 랭킹</h3>
        </div>
      </div>

      {error ? (
        <div className="text-center text-white/70 py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="font-['Pretendard']">랭킹 정보를 불러올 수 없습니다.</p>
        </div>
      ) : ranking.length > 0 ? (
        <div className="space-y-3">
          {ranking.slice(0, 5).map((user, index) => (
            <div
              key={user.userId}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm font-['Inter']",
                index === 0 && "bg-yellow-500/90",
                index === 1 && "bg-gray-400/90",
                index === 2 && "bg-amber-600/90",
                index > 2 && "bg-[#4B2199]/80"
              )}>
                {user.rank}
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#4B2199]/20 flex items-center justify-center overflow-hidden">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.username}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-sm font-medium text-[#B5A6E0] font-['Pretendard']">
                    {user.username.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white font-['Pretendard']">{user.username}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#B5A6E0] font-['Inter']">{user.points}P</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-white/70 py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="font-['Pretendard']">랭킹 정보가 없습니다.</p>
        </div>
      )}
    </BentoCard>
  )
}