import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, isAuthenticated } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import Navbar from '@/components/common/navbar'
import Footer from '@/pages/common/footer'
import ProfileCard from '@/components/user/ProfileCard'
import PointRankingCard from '@/components/user/PointRankingCard'
import PlaylistCard from '@/components/user/PlaylistCard'
import RecentSongsCard from '@/components/user/RecentSongsCard'
import SpotifyCard from '@/components/user/SpotifyCard'
import EditProfileModal from '@/components/user/EditProfileModal'
import SpotifyModal from '@/components/user/SpotifyModal'
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
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatusResponse['data'] | null>(null)
  const [spotifyProfile, setSpotifyProfile] = useState<SpotifyProfileResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiErrors, setApiErrors] = useState({
    playlists: false,
    recentSongs: false,
    ranking: false,
    checkin: false
  })
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [spotifyModalOpen, setSpotifyModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    username: ''
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=/mypage')
      return
    }
    loadAllData()
  }, [navigate])

  // Spotify 연동 후 돌아왔을 때 데이터 새로고침
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const spotifyConnected = urlParams.get('spotify_connected')

    if (spotifyConnected === 'true') {
      // URL에서 파라미터 제거
      navigate('/mypage', { replace: true })
      // Spotify 데이터만 다시 로드
      loadSpotifyData()
      toast.success('Spotify 연동이 완료되었습니다!')
    }
  }, [location.search, navigate])

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
      setSpotifyStatus(response.data.data)
    } catch (err) {
      console.error('Spotify 상태 로딩 실패:', err)
    }
  }

  const loadSpotifyProfile = async () => {
    try {
      const response = await getSpotifyProfileAPI()
      setSpotifyProfile(response.data.data)
    } catch (err) {
      console.error('Spotify 프로필 로딩 실패:', err)
      setSpotifyProfile(null)
    }
  }

  const loadSpotifyData = async () => {
    try {
      await Promise.allSettled([
        loadSpotifyStatus(),
        loadSpotifyProfile()
      ])
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
      setSpotifyModalOpen(false)
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
            <Tabs defaultValue="overview" className="w-full">
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

              <TabsContent value="overview" className="flex h-[600px]">
                <div className="flex w-full gap-6">
                  <div className="flex-1">
                    <ProfileCard
                      profile={profile}
                      checkinInfo={checkinInfo}
                      checkinError={apiErrors.checkin}
                      onEditClick={openEditModal}
                      onCheckinClick={handleCheckin}
                    />
                  </div>
                  <div className="flex-1">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span>📊</span>
                          학습 현황
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col h-full">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-4 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold text-primary">{recentSongs.length}</div>
                            <div className="text-sm text-muted-foreground">학습한 곡</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold text-primary">{playlists.length}</div>
                            <div className="text-sm text-muted-foreground">내 플레이리스트</div>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">현재 포인트</div>
                          <div className="text-lg font-semibold text-yellow-600">
                            {pointProfile ? `${pointProfile.balance}P` : '로딩 중...'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="learning" className="flex h-[600px]">
                <div className="flex w-full gap-6">
                  <div className="flex-1">
                    <RecentSongsCard recentSongs={recentSongs} error={apiErrors.recentSongs} />
                  </div>
                  <div className="flex-1">
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
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="playlists" className="flex h-[600px]">
                <div className="flex w-full gap-6">
                  <div className="flex-1">
                    <PlaylistCard playlists={playlists} error={apiErrors.playlists} />
                  </div>
                  <div className="flex-1">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span>🎯</span>
                          플레이리스트 관리
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col h-full">
                        <div className="space-y-4">
                          <div className="text-center p-4 rounded-lg bg-muted/30">
                            <div className="text-2xl font-bold text-primary">{playlists.length}</div>
                            <div className="text-sm text-muted-foreground">내 플레이리스트</div>
                          </div>
                          <Separator />
                          <div className="text-sm text-muted-foreground text-center">
                            좋아하는 곡들을 모아서 체계적으로 학습하세요.
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="spotify" className="flex h-[600px]">
                <div className="flex w-full gap-6">
                  <div className="flex-1">
                    <SpotifyCard
                      spotifyStatus={spotifyStatus}
                      spotifyProfile={spotifyProfile}
                      onManageClick={() => setSpotifyModalOpen(true)}
                    />
                  </div>
                  <div className="flex-1">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span>🎵</span>
                          음악 스트리밍
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col h-full">
                        <div className="space-y-4">
                          <div className="text-center p-4 rounded-lg bg-muted/30">
                            <div className="text-lg font-bold text-primary">
                              {spotifyStatus?.connected ? '연동됨' : '미연동'}
                            </div>
                            <div className="text-sm text-muted-foreground">연동 상태</div>
                          </div>
                          <Separator />
                          <div className="text-sm text-muted-foreground text-center">
                            Spotify와 연동하여 더 많은 음악으로 학습하세요.
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ranking" className="flex h-[600px]">
                <div className="flex w-full gap-6">
                  <div className="flex-1">
                    <PointRankingCard ranking={ranking} error={apiErrors.ranking} />
                  </div>
                  <div className="flex-1">
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
                  </div>
                </div>
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

          {/* Spotify 연동 모달 */}
          <SpotifyModal
            open={spotifyModalOpen}
            onOpenChange={setSpotifyModalOpen}
            spotifyStatus={spotifyStatus}
            spotifyProfile={spotifyProfile}
            onConnect={handleSpotifyConnect}
            onDisconnect={handleSpotifyDisconnect}
          />
        </div>
      </div>
      <Footer />
    </div>
  )
}