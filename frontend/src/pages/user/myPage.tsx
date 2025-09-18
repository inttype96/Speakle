import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, isAuthenticated } from '@/store/auth'
import { Card, CardContent, } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Navbar from '@/components/common/navbar'
import Footer from '@/pages/common/footer'
// import ProfileCard from '@/components/user/ProfileCard'
// import PointRankingCard from '@/components/user/PointRankingCard'
// import PlaylistCard from '@/components/user/PlaylistCard'
// import RecentSongsCard from '@/components/user/RecentSongsCard'
// import SpotifyCard from '@/components/user/SpotifyCard'
import EditProfileModal from '@/components/user/EditProfileModal'
import OverviewTab from '@/components/user/my-page-tabs/OverviewTab'
import LearningTab from '@/components/user/my-page-tabs/LearningTab'
import PlaylistsTab from '@/components/user/my-page-tabs/PlaylistsTab'
import SpotifyTab from '@/components/user/my-page-tabs/SpotifyTab'
import RankingTab from '@/components/user/my-page-tabs/RankingTab'
import { getUserProfileAPI } from '@/services/auth'
import {
  getPointProfileAPI,
  getPointRankingAPI,
  getUserPlaylistsAPI,
  getRecentLearnedSongsAPI,
  checkinAPI,
  getCheckinInfoAPI,
  updateUserAPI,
  deleteUserAPI,
  type PointProfile,
  type RankingUser,
  type Playlist,
  type LearnedSong,
  type CheckinResponse
} from '@/services/mypage'
import {
  connectSpotifyAPI,
  getSpotifyStatusAPI,
  getSpotifyProfileAPI,
  disconnectSpotifyAPI,
  type SpotifyStatusResponse,
  type SpotifyProfileResponse
} from '@/services/spotify'
import type { UserProfile } from '@/types/auth'
import { AxiosError } from 'axios'
import { toast } from 'sonner'

export default function MyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, setUserId } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [pointProfile, setPointProfile] = useState<PointProfile | null>(null)
  const [ranking, setRanking] = useState<RankingUser[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [recentSongs, setRecentSongs] = useState<LearnedSong[]>([])
  const [checkinInfo, setCheckinInfo] = useState<CheckinResponse['data'] | null>(null)
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatusResponse | null>(null)
  const [spotifyProfile, setSpotifyProfile] = useState<SpotifyProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiErrors, setApiErrors] = useState({
    playlists: false,
    recentSongs: false,
    ranking: false,
    checkin: false
  })
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    username: ''
  })
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=/mypage')
      return
    }
    loadAllData()
  }, [navigate])

  // Spotify 탭이 활성화될 때 데이터 새로고침
  useEffect(() => {
    if (activeTab === 'spotify') {
      loadSpotifyData()
    }
  }, [activeTab])

  // 페이지 포커스될 때 Spotify 데이터 새로고침 (연동 후 돌아왔을 때)
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        loadSpotifyData(true) // 연동 성공 토스트 표시
      }
    }

    document.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      const profileResponse = await getUserProfileAPI()

      // API 응답 구조 확인하고 데이터 추출
      let profileData: UserProfile
      if (profileResponse.data?.data) {
        profileData = profileResponse.data.data
      } else if (profileResponse.data && 'id' in profileResponse.data) {
        profileData = profileResponse.data as unknown as UserProfile
      } else {
        throw new Error('사용자 프로필 데이터를 찾을 수 없습니다.')
      }

      setProfile(profileData)

      // userId를 스토어에 저장
      if (profileData.id) {
        setUserId(profileData.id)
      }

      // userId가 없으면 에러 처리
      if (!profileData.id) {
        setError('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.')
        return
      }

      // 병렬로 데이터 로드
      const userId = profileData.id
      const today = new Date().toISOString().split('T')[0]

      await Promise.allSettled([
        loadPointProfile(userId),
        loadRanking(),
        loadPlaylists(),
        loadRecentSongs(),
        loadCheckinInfo(userId, today),
        loadSpotifyStatus(),
        loadSpotifyProfile()
      ])
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

  const loadRanking = async () => {
    try {
      const response = await getPointRankingAPI()
      setRanking(response.data.data)
      setApiErrors(prev => ({ ...prev, ranking: false }))
    } catch (err: any) {
      console.error('랭킹 정보 로딩 실패:', err)
      // 404 오류인 경우 랭킹 기능이 아직 구현되지 않았음을 표시
      if (err.response?.status === 404) {
        console.log('랭킹 API가 아직 구현되지 않았습니다.')
        setRanking([]) // 빈 배열로 설정
        setApiErrors(prev => ({ ...prev, ranking: false })) // 오류로 표시하지 않음
      } else {
        setApiErrors(prev => ({ ...prev, ranking: true }))
      }
    }
  }

  const loadPlaylists = async () => {
    try {
      const response = await getUserPlaylistsAPI()
      setPlaylists(response.data.data)
      setApiErrors(prev => ({ ...prev, playlists: false }))
    } catch (err) {
      console.error('플레이리스트 로딩 실패:', err)
      setApiErrors(prev => ({ ...prev, playlists: true }))
    }
  }

  const loadRecentSongs = async () => {
    try {
      const response = await getRecentLearnedSongsAPI(1, 5)
      setRecentSongs(response.data.data.learnedSongs)
      setApiErrors(prev => ({ ...prev, recentSongs: false }))
    } catch (err) {
      console.error('최근 학습 곡 로딩 실패:', err)
      setApiErrors(prev => ({ ...prev, recentSongs: true }))
    }
  }

  const loadCheckinInfo = async (userId: number, date: string) => {
    try {
      if (!userId) {
        console.error('loadCheckinInfo: userId is missing')
        setApiErrors(prev => ({ ...prev, checkin: true }))
        return
      }
      const response = await getCheckinInfoAPI(userId, date)
      setCheckinInfo(response.data.data)
      setApiErrors(prev => ({ ...prev, checkin: false }))
    } catch (err) {
      console.error('출석 정보 로딩 실패:', err)
      setApiErrors(prev => ({ ...prev, checkin: true }))
    }
  }

  const loadSpotifyStatus = async () => {
    try {
      const response = await getSpotifyStatusAPI()
      setSpotifyStatus(response.data)
    } catch (err) {
      console.error('Spotify 상태 로딩 실패:', err)
    }
  }

  const loadSpotifyProfile = async () => {
    try {
      const response = await getSpotifyProfileAPI()
      setSpotifyProfile(response.data)
    } catch (err) {
      console.error('Spotify 프로필 로딩 실패:', err)
      setSpotifyProfile(null)
    }
  }

  const loadSpotifyData = async (showSuccessToast = false) => {
    try {
      const [statusResult, profileResult] = await Promise.allSettled([
        loadSpotifyStatus(),
        loadSpotifyProfile()
      ])

      // 연동 성공 체크 (status가 성공적으로 로드되고 connected가 true인 경우)
      if (showSuccessToast && statusResult.status === 'fulfilled') {
        const currentStatus = spotifyStatus
        // 새로 로드된 후 연동 상태 확인은 다음 렌더링에서 확인
        setTimeout(() => {
          if (spotifyStatus?.connected && !currentStatus?.connected) {
            toast.success('Spotify 연동이 완료되었습니다!')
          }
        }, 100)
      }
    } catch (err) {
      console.error('Spotify 데이터 로딩 실패:', err)
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

  const handleLogout = () => {
    if (confirm('정말로 로그아웃하시겠습니까?')) {
      logout()
      navigate('/login')
    }
  }

  const handleCheckin = async () => {
    if (!profile) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await checkinAPI({
        userId: profile.id,
        localDate: today
      })

      setCheckinInfo(response.data.data)
      toast.success('출석 체크가 완료되었습니다!')
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error('이미 오늘 출석체크를 완료했습니다.')
      } else {
        toast.error('출석 체크에 실패했습니다.')
      }
    }
  }

  const handleEditProfile = async () => {
    try {
      await updateUserAPI({
        username: editForm.username,
        gender: profile?.gender || '',
        birth: profile?.birth || '',
        profileImageUrl: ''
      })
      toast.success('프로필이 수정되었습니다.')
      setEditModalOpen(false)
      loadAllData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || '프로필 수정에 실패했습니다.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('정말로 회원탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      await deleteUserAPI()
      toast.success('회원탈퇴가 완료되었습니다.')
      logout()
      navigate('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.message || '회원탈퇴에 실패했습니다.')
    }
  }

  const openEditModal = () => {
    if (profile) {
      setEditForm({
        username: profile.username
      })
      setEditModalOpen(true)
    }
  }

  const handleSpotifyConnect = async () => {
    try {
      const response = await connectSpotifyAPI()
      window.location.href = response.data.redirectUrl
    } catch (err: any) {
      toast.error('Spotify 연동에 실패했습니다.')
    }
  }

  const handleSpotifyDisconnect = async () => {
    if (!confirm('Spotify 연동을 해제하시겠습니까?')) {
      return
    }

    try {
      await disconnectSpotifyAPI()
      setSpotifyStatus({ connected: false, expiresAtEpochSec: null, scope: null })
      setSpotifyProfile(null)
      toast.success('Spotify 연동이 해제되었습니다.')
    } catch (err: any) {
      toast.error('Spotify 연동 해제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="bg-background text-foreground">
        <Navbar />
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="container mx-auto py-6 max-w-4xl">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">사용자 정보를 불러오는 중...</p>
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
        <div className="mx-auto py-6 max-w-6xl px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">마이페이지</h1>
              <p className="text-muted-foreground">
                내 정보를 확인하고 관리하세요.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openEditModal} variant="outline" size="sm">
                프로필 수정
              </Button>
            </div>
          </div>

          {error && (
            <Card className="mb-6 border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive mb-3">
                  <span>⚠️</span>
                  <p className="font-medium">오류가 발생했습니다</p>
                </div>
                <p className="text-sm mb-3">{error}</p>
                <div className="flex gap-2">
                  <Button onClick={loadAllData} variant="outline" size="sm">
                    다시 시도
                  </Button>
                  {error.includes('인증') && (
                    <Button onClick={handleLogout} variant="destructive" size="sm">
                      다시 로그인
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {profile && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="learning" className="flex items-center gap-1">
                  학습 관리
                  <Badge variant="secondary" className="ml-1 text-xs">{recentSongs.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="playlists" className="flex items-center gap-1">
                  플레이리스트
                  <Badge variant="secondary" className="ml-1 text-xs">{playlists.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="spotify">Spotify 연동</TabsTrigger>
                <TabsTrigger value="ranking" className="flex items-center gap-1">
                  랭킹
                  {ranking.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{ranking.length}</Badge>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <OverviewTab
                  profile={profile}
                  checkinInfo={checkinInfo}
                  checkinError={apiErrors.checkin}
                  onEditClick={openEditModal}
                  onCheckinClick={handleCheckin}
                  recentSongs={recentSongs}
                  pointProfile={pointProfile}
                  recentSongsError={apiErrors.recentSongs}
                />
              </TabsContent>

              <TabsContent value="learning" className="flex h-[600px]">
                <LearningTab recentSongs={recentSongs} error={apiErrors.recentSongs} />
              </TabsContent>

              <TabsContent value="playlists" className="flex h-[600px]">
                <PlaylistsTab playlists={playlists} error={apiErrors.playlists} />
              </TabsContent>

              <TabsContent value="spotify" className="space-y-6">
                <SpotifyTab
                  spotifyStatus={spotifyStatus}
                  spotifyProfile={spotifyProfile}
                  onConnect={handleSpotifyConnect}
                  onDisconnect={handleSpotifyDisconnect}
                />
              </TabsContent>

              <TabsContent value="ranking" className="flex h-[600px]">
                <RankingTab
                  ranking={ranking}
                  error={apiErrors.ranking}
                  pointProfile={pointProfile}
                />
              </TabsContent>
            </Tabs>
          )}

          {/* 프로필 수정 모달 */}
          <EditProfileModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            editForm={editForm}
            onFormChange={setEditForm}
            onSave={handleEditProfile}
            onDeleteAccount={handleDeleteAccount}
          />

        </div>
      </div>
      <Footer />
    </div>
  )
}