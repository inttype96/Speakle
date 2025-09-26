import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, isAuthenticated } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/common/navbar'
import Footer from '@/pages/common/footer'
import { getUserProfileAPI } from '@/services/auth'
import { getPointProfileAPI, type PointProfile } from '@/services/mypage'
import type { UserProfile } from '@/types/auth'
import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { Trophy, Award, Star, Gift, TrendingUp, Calendar, Users, Target, Music, Clock } from 'lucide-react'

interface RewardItem {
    id: number
    title: string
    description: string
    cost: number
    type: 'avatar' | 'theme' | 'feature' | 'premium'
    available: boolean
    owned: boolean
    icon: React.ReactNode
}

interface Achievement {
    id: number
    title: string
    description: string
    points: number
    completed: boolean
    progress: number
    maxProgress: number
    icon: React.ReactNode
    category: 'quiz' | 'streak' | 'social' | 'special'
}

interface QuizSession {
    id: string
    songTitle: string
    score: number
    date: string
    pointsEarned: number
}

export default function RewardPage() {
    const navigate = useNavigate()
    const { setUserId } = useAuthStore()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [pointProfile, setPointProfile] = useState<PointProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 사용자 통계
    const [userStats] = useState({
        totalQuizzes: 127,
        correctAnswers: 2543,
        streakDays: 15,
        totalPoints: pointProfile?.balance || 8420
    })

    // 최근 퀴즈 세션
    const [recentSessions] = useState<QuizSession[]>([
        {
            id: '1',
            songTitle: 'Blinding Lights',
            score: 95,
            date: 'Today, 2:30 PM',
            pointsEarned: 150
        },
        {
            id: '2',
            songTitle: 'Shape of you',
            score: 88,
            date: 'Tomorrow, 10:00 AM',
            pointsEarned: 120
        },
        {
            id: '3',
            songTitle: 'out of Time',
            score: 92,
            date: 'May 20, 9:00 AM',
            pointsEarned: 140
        }
    ])

    // 상위 학습자 데이터
    const [topStudents] = useState([
        { rank: 1, name: 'Alex John', subject: 'Science', score: 950 },
        { rank: 2, name: 'Emma Watson', subject: 'Mathematics', score: 920 },
        { rank: 3, name: 'Michael Clark', subject: 'Physics', score: 980 },
        { rank: 4, name: 'Sophia Green', subject: 'English', score: 890 },
        { rank: 5, name: 'Lucia Wilde', subject: 'Science', score: 870 }
    ])

    const [rewards] = useState<RewardItem[]>([
        {
            id: 1,
            title: '프리미엄 1개월',
            description: '광고 없는 학습과 고급 기능 이용',
            cost: 5000,
            type: 'premium',
            available: true,
            owned: false,
            icon: <Award className="w-6 h-6" />
        },
        {
            id: 2,
            title: '다크 테마',
            description: '눈이 편한 다크 모드 테마',
            cost: 1000,
            type: 'theme',
            available: true,
            owned: false,
            icon: <Star className="w-6 h-6" />
        },
        {
            id: 3,
            title: '힌트 팩 (10개)',
            description: '어려운 문제에서 사용할 수 있는 힌트',
            cost: 500,
            type: 'feature',
            available: true,
            owned: false,
            icon: <Gift className="w-6 h-6" />
        },
        {
            id: 4,
            title: 'Spotify 할인 쿠폰',
            description: 'Spotify 프리미엄 20% 할인',
            cost: 3000,
            type: 'premium',
            available: false,
            owned: false,
            icon: <TrendingUp className="w-6 h-6" />
        }
    ])

    const [achievements] = useState<Achievement[]>([
        {
            id: 1,
            title: '첫 퀴즈 완료',
            description: '첫 번째 퀴즈를 완료했습니다',
            points: 100,
            completed: true,
            progress: 1,
            maxProgress: 1,
            icon: <Star className="w-5 h-5" />,
            category: 'quiz'
        },
        {
            id: 2,
            title: '퀴즈 마스터',
            description: '100개의 퀴즈를 완료하세요',
            points: 300,
            completed: true,
            progress: 127,
            maxProgress: 100,
            icon: <Trophy className="w-5 h-5" />,
            category: 'quiz'
        },
        {
            id: 3,
            title: '일주일 연속',
            description: '7일 연속으로 퀴즈를 풀어보세요',
            points: 500,
            completed: true,
            progress: 15,
            maxProgress: 7,
            icon: <Calendar className="w-5 h-5" />,
            category: 'streak'
        },
        {
            id: 4,
            title: '정확도 왕',
            description: '정답률 90% 이상 달성',
            points: 1000,
            completed: false,
            progress: 85,
            maxProgress: 90,
            icon: <Target className="w-5 h-5" />,
            category: 'quiz'
        },
        {
            id: 5,
            title: '소셜 버터플라이',
            description: '친구 10명과 퀴즈 대결',
            points: 500,
            completed: false,
            progress: 6,
            maxProgress: 10,
            icon: <Users className="w-5 h-5" />,
            category: 'social'
        }
    ])

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login?redirect=/rewards')
            return
        }
        loadAllData()
    }, [navigate])

    const loadAllData = async () => {
        try {
            setLoading(true)
            setError(null)

            const profileResponse = await getUserProfileAPI()

            let profileData: UserProfile
            if (profileResponse.data?.data) {
                profileData = profileResponse.data.data
            } else if (profileResponse.data && 'id' in profileResponse.data) {
                profileData = profileResponse.data as unknown as UserProfile
            } else {
                throw new Error('사용자 프로필 데이터를 찾을 수 없습니다.')
            }

            setProfile(profileData)

            if (profileData.id) {
                setUserId(profileData.id)
                await loadPointProfile(profileData.id)
            }
        } catch (err: any) {
            console.error('데이터 로딩 실패:', err)
            handleError(err, '데이터를 불러오는데 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    const loadPointProfile = async (userId: number) => {
        try {
            if (!userId) {
                console.error('loadPointProfile: userId is missing')
                return
            }
            const response = await getPointProfileAPI(userId)
            setPointProfile(response.data.data)
        } catch (err) {
            console.error('포인트 정보 로딩 실패:', err)
        }
    }

    const handleError = (err: any, defaultMessage: string) => {
        if (err instanceof AxiosError) {
            const status = err.response?.status
            const message = err.response?.data?.message || defaultMessage

            switch (status) {
                case 401:
                    setError('인증이 만료되었습니다. 다시 로그인해주세요.')
                    break
                case 404:
                    setError('데이터를 찾을 수 없습니다.')
                    break
                case 500:
                    setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
                    break
                default:
                    setError(message)
            }
        } else {
            setError('네트워크 오류가 발생했습니다.')
        }
    }

    const handlePurchaseReward = async (rewardId: number) => {
        const reward = rewards.find(r => r.id === rewardId)
        if (!reward || !pointProfile) return

        if (pointProfile.balance < reward.cost) {
            toast.error('포인트가 부족합니다.')
            return
        }

        if (confirm(`${reward.title}를 ${reward.cost}P에 구매하시겠습니까?`)) {
            try {
                toast.success(`${reward.title}를 구매했습니다!`)
            } catch (err: any) {
                toast.error('구매에 실패했습니다.')
            }
        }
    }

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'quiz': return 'from-purple-500/20 to-blue-500/20 border-purple-500/30';
            case 'streak': return 'from-orange-500/20 to-red-500/20 border-orange-500/30';
            case 'social': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
            case 'special': return 'from-pink-500/20 to-purple-500/20 border-pink-500/30';
            default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar />
                <div className="relative isolate px-6 pt-14 lg:px-8">
                    <div className="container mx-auto py-6 max-w-4xl">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                                <p className="text-gray-400">리워드 정보를 불러오는 중...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="w-full max-w-screen-xl mx-auto py-6 px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                            <p className="text-gray-400">
                                Welcome back, {profile?.username || 'Soyeon'}! 함께 학습하는 즐거움의 순간을 만들어봐요.
                            </p>
                        </div>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg">
                            학습 더 하러가기
                        </Button>
                    </div>

                    {error && (
                        <Card className="mb-6 border-red-500/50 bg-red-900/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-red-400 mb-3">
                                    <span>⚠️</span>
                                    <p className="font-medium">오류가 발생했습니다</p>
                                </div>
                                <p className="text-sm mb-3">{error}</p>
                                <Button onClick={loadAllData} variant="outline" size="sm">
                                    다시 시도
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Trophy className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <span className="text-2xl font-bold text-purple-400">
                    {userStats.totalQuizzes}
                  </span>
                                </div>
                                <h3 className="text-gray-300 font-medium">연습 학습한</h3>
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <Target className="w-6 h-6 text-green-400" />
                                    </div>
                                    <span className="text-2xl font-bold text-green-400">
                    {userStats.correctAnswers.toLocaleString()}
                  </span>
                                </div>
                                <h3 className="text-gray-300 font-medium">포인트</h3>
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Users className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <span className="text-2xl font-bold text-blue-400">
                    {userStats.correctAnswers.toLocaleString()}
                  </span>
                                </div>
                                <h3 className="text-gray-300 font-medium">팔로잉</h3>
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-orange-500/20 rounded-lg">
                                        <Award className="w-6 h-6 text-orange-400" />
                                    </div>
                                    <span className="text-2xl font-bold text-orange-400">
                    {userStats.correctAnswers.toLocaleString()}
                  </span>
                                </div>
                                <h3 className="text-gray-300 font-medium">최근 학습한</h3>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Songs & Top Students */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Recent Songs */}
                            <Card className="bg-gray-900/50 border-gray-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Music className="w-5 h-5" />
                                        Recent Songs
                                    </CardTitle>
                                    <p className="text-gray-400 text-sm">최근 학습한 곡을 모아 놨습니다.</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {recentSessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                                                    <Music className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-white">{session.songTitle}</h4>
                                                    <p className="text-gray-400 text-sm flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {session.date}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                            >
                                                복습하기
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Achievements Grid */}
                            <Card className="bg-gray-900/50 border-gray-800">
                                <CardHeader>
                                    <CardTitle className="text-white">업적</CardTitle>
                                    <p className="text-gray-400 text-sm">다양한 업적을 달성하고 포인트를 획득하세요</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {achievements.slice(0, 4).map((achievement) => (
                                            <div
                                                key={achievement.id}
                                                className={`bg-gradient-to-r ${getCategoryColor(achievement.category)} rounded-xl p-4 border transition-all duration-200 ${
                                                    achievement.completed ? 'opacity-100' : 'opacity-75'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-white/10 rounded-lg">
                                                        {achievement.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-white text-sm">
                                                                {achievement.title}
                                                            </h3>
                                                            {achievement.completed && (
                                                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                            )}
                                                        </div>
                                                        <p className="text-gray-300 text-xs mb-2">
                                                            {achievement.description}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-black/20 rounded-full h-1.5">
                                                                <div
                                                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                                                        achievement.completed ? 'bg-green-400' : 'bg-white/60'
                                                                    }`}
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            (achievement.progress / achievement.maxProgress) * 100,
                                                                            100
                                                                        )}%`
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs text-gray-300">
                                {achievement.progress}/{achievement.maxProgress}
                              </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Students */}
                        <div>
                            <Card className="bg-gray-900/50 border-gray-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Trophy className="w-5 h-5 text-yellow-400" />
                                        Top Students
                                    </CardTitle>
                                    <p className="text-gray-400 text-sm">Students with highest quiz scores</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {topStudents.map((student) => (
                                        <div
                                            key={student.rank}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/50"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                                                {student.rank}
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-white text-sm">{student.name}</h4>
                                                <p className="text-gray-400 text-xs">{student.subject}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-yellow-400">
                                                <Star className="w-4 h-4" />
                                                <span className="font-medium text-sm">{student.score}</span>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Rewards Store Preview */}
                            <Card className="bg-gray-900/50 border-gray-800 mt-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Gift className="w-5 h-5 text-purple-400" />
                                        리워드 상점
                                    </CardTitle>
                                    <p className="text-gray-400 text-sm">포인트로 다양한 아이템을 구매하세요</p>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {rewards.slice(0, 3).map((reward) => (
                                        <div
                                            key={reward.id}
                                            className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                                    {reward.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white text-sm">{reward.title}</h3>
                                                    <p className="text-gray-400 text-xs">{reward.description}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                                                    <Star className="w-3 h-3" />
                                                    {reward.cost}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="bg-purple-600 hover:bg-purple-700 text-white mt-1 text-xs px-2 py-1 h-6"
                                                    onClick={() => handlePurchaseReward(reward.id)}
                                                    disabled={!reward.available || reward.owned || (pointProfile?.balance || 0) < reward.cost}
                                                >
                                                    {reward.owned ? '보유중' : '구매'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}
