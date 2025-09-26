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
  getAttendanceAPI,
  getRecentLearnedSongsAPI,
  getPointRankingAPI,
  type PointProfile,
  type LearnedSong,
  type RankingUser
} from '@/services/mypage'

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

      const [pointResult, attendanceResult, recentSongsResult, rankingResult] = await Promise.allSettled([
        getPointProfileAPI(userId!),
        getAttendanceAPI(),
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
      if (attendanceResult.status === 'fulfilled') {
        setCheckinInfo(attendanceResult.value.data.data)
        setErrors(prev => ({ ...prev, checkin: false }))
      } else {
        console.error('출석 정보 로딩 실패:', attendanceResult.reason)
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


  const isCheckedInToday = () => {
    return checkinInfo?.checkedToday || false
  }

  if (loading) {
    return (
      <div className="bg-background text-foreground font-sans min-h-screen">
        {/* Google Fonts Link */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <Navbar />
        <div aria-hidden className="h-16 md:h-20" />

        {/* 상단 여백 추가 */}
        <div className="h-8" />

        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20">
          <div className="container mx-auto py-6 max-w-4xl">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb] mx-auto mb-4"></div>
                <p className="font-['Pretendard'] text-white/80">대시보드를 불러오는 중...</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground font-sans min-h-screen">
      {/* Google Fonts Link */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />

      {/* 상단 여백 추가 */}
      <div className="h-8" />

      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <div className="container mx-auto py-6 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-3 text-white font-['Pretendard']">
              학습 대시보드
            </h1>
            <p className="text-lg font-['Pretendard'] text-white/70">
              오늘도 즐거운 영어 학습하세요! 🎵
            </p>
          </div>

          <BentoGrid>
            {/* 연속 출석일 카드 */}
            <StreakCard
              currentStreak={checkinInfo?.currentStreak || 0}
              isCheckedIn={isCheckedInToday()}
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
