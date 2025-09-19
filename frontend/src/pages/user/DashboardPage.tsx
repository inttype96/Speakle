import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, isAuthenticated } from '@/store/auth'
import { BentoGrid } from '@/components/ui/bento-card'
import {
  StreakCard,
  PointsCard,
  ExploreCard,
  RecentSongsCard,
  RankingCard
} from '@/components/dashboard/dashboard-cards'
import Navbar from '@/components/common/navbar'
import Footer from '@/pages/common/footer'
import {
  getPointProfileAPI,
  getCheckinInfoAPI,
  getRecentLearnedSongsAPI,
  getPointRankingAPI,
  checkinAPI,
  type PointProfile,
  type LearnedSong,
  type RankingUser
} from '@/services/mypage'
import { toast } from 'sonner'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { userId } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [pointProfile, setPointProfile] = useState<PointProfile | null>(null)
  const [checkinInfo, setCheckinInfo] = useState<any>(null)
  const [recentSongs, setRecentSongs] = useState<LearnedSong[]>([])
  const [ranking, setRanking] = useState<RankingUser[]>([])
  const [errors, setErrors] = useState({
    pointProfile: false,
    checkin: false,
    recentSongs: false,
    ranking: false
  })
  const [checkinLoading, setCheckinLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=/dashboard')
      return
    }
    if (!userId) {
      return
    }
    loadDashboardData()
  }, [navigate, userId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      const [pointResult, checkinResult, recentSongsResult, rankingResult] = await Promise.allSettled([
        getPointProfileAPI(userId!),
        getCheckinInfoAPI(userId!, today),
        getRecentLearnedSongsAPI(1, 5),
        getPointRankingAPI()
      ])

      // 포인트 프로필 처리
      if (pointResult.status === 'fulfilled') {
        setPointProfile(pointResult.value.data.data)
        setErrors(prev => ({ ...prev, pointProfile: false }))
      } else {
        console.error('포인트 프로필 로딩 실패:', pointResult.reason)
        setErrors(prev => ({ ...prev, pointProfile: true }))
      }

      // 출석 정보 처리
      if (checkinResult.status === 'fulfilled') {
        setCheckinInfo(checkinResult.value.data.data)
        setErrors(prev => ({ ...prev, checkin: false }))
      } else {
        console.error('출석 정보 로딩 실패:', checkinResult.reason)
        setErrors(prev => ({ ...prev, checkin: true }))
      }

      // 최근 학습 곡 처리
      if (recentSongsResult.status === 'fulfilled') {
        setRecentSongs(recentSongsResult.value.data.data.learnedSongs)
        setErrors(prev => ({ ...prev, recentSongs: false }))
      } else {
        console.error('최근 학습 곡 로딩 실패:', recentSongsResult.reason)
        setErrors(prev => ({ ...prev, recentSongs: true }))
      }

      // 랭킹 정보 처리
      if (rankingResult.status === 'fulfilled') {
        setRanking(rankingResult.value.data.data)
        setErrors(prev => ({ ...prev, ranking: false }))
      } else {
        console.error('랭킹 정보 로딩 실패:', rankingResult.reason)
        setErrors(prev => ({ ...prev, ranking: true }))
      }

    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleCheckin = async () => {
    if (!userId) return

    try {
      setCheckinLoading(true)
      const today = new Date().toISOString().split('T')[0]

      const response = await checkinAPI({
        userId: userId,
        localDate: today
      })

      if (response.data.data) {
        setCheckinInfo(response.data.data)
        toast.success('출석 체크가 완료되었습니다!')

        // 포인트 정보도 업데이트
        loadDashboardData()
      }
    } catch (error: any) {
      console.error('출석 체크 실패:', error)
      const status = error.response?.status
      const message = error.response?.data?.message

      switch (status) {
        case 400:
          toast.error(message || '요청 값이 올바르지 않습니다.')
          break
        case 409:
          toast.error(message || '이미 오늘 출석체크를 완료했습니다.')
          break
        case 500:
          toast.error(message || '출석 처리 중 오류가 발생했습니다.')
          break
        default:
          toast.error('출석 체크에 실패했습니다. 다시 시도해주세요.')
      }
    } finally {
      setCheckinLoading(false)
    }
  }

  const isCheckedInToday = () => {
    if (!checkinInfo?.lastCheckinDate) return false
    const today = new Date().toISOString().split('T')[0]
    return checkinInfo.lastCheckinDate === today
  }

  if (loading) {
    return (
      <div className="bg-background text-foreground">
        <Navbar />
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="container mx-auto py-6 max-w-6xl">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">대시보드를 불러오는 중...</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground">
      <Navbar />

      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="container mx-auto py-6 max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              학습 대시보드
            </h1>
            <p className="text-xl text-muted-foreground">
              오늘도 즐거운 영어 학습하세요! 🎵
            </p>
          </div>

          <BentoGrid>
            {/* 연속 출석일 카드 */}
            <StreakCard
              currentStreak={checkinInfo?.currentStreak || 0}
              longestStreak={checkinInfo?.longestStreak || 0}
              totalDays={checkinInfo?.totalDays || 0}
              onCheckin={handleCheckin}
              isCheckedIn={isCheckedInToday()}
              loading={checkinLoading}
            />

            {/* 포인트 카드 */}
            {pointProfile && (
              <PointsCard
                balance={pointProfile.balance}
                level={pointProfile.level}
              />
            )}

            {/* 학습 시작 카드 */}
            <ExploreCard />

            {/* 최근 학습한 곡 */}
            <RecentSongsCard
              recentSongs={recentSongs}
              error={errors.recentSongs}
            />

            {/* 포인트 랭킹 */}
            <RankingCard
              ranking={ranking}
              error={errors.ranking}
            />
          </BentoGrid>
        </div>
      </div>

      <Footer />
    </div>
  )
}