import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, isAuthenticated } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/common/navbar'
import Footer from '@/pages/common/footer'
import EditProfileModal from '@/components/user/EditProfileModal'
import { getUserProfileAPI } from '@/services/auth'
import {
  updateUserAPI,
  deleteUserAPI
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
  const { logout, setUserId } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatusResponse | null>(null)
  const [spotifyProfile, setSpotifyProfile] = useState<SpotifyProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
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

      // Spotify 데이터 로드
      await Promise.allSettled([
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
      const [statusResult] = await Promise.allSettled([
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

        <div className="relative isolate px-6 pt-24 lg:px-8">
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

      <div className="relative isolate px-6 pt-4 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
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
            <div className="space-y-6">
              {/* 프로필 정보 섹션 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      프로필 정보
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Spotify 연동 설정 섹션 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🎵</span>
                    Spotify 연동 설정
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {spotifyStatus?.connected ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Spotify 계정이 연동되었습니다
                        </span>
                      </div>

                      {spotifyProfile && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">연동된 계정</p>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                              {spotifyProfile.displayName?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="font-medium">{spotifyProfile.displayName}</p>
                              <p className="text-sm text-muted-foreground">
                                {spotifyProfile.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button onClick={handleSpotifyDisconnect} variant="destructive">
                        연동 해제
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center space-y-2">
                        <p className="text-muted-foreground">
                          Spotify 계정을 연동하여 개인화된 음악 학습을 시작하세요
                        </p>
                      </div>
                      <Button onClick={handleSpotifyConnect} className="w-full">
                        Spotify 연동하기
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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