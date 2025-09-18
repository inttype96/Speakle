import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, isAuthenticated } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import type { UserProfile } from '@/types/auth'
import { AxiosError } from 'axios'
import { toast } from 'sonner'

export default function MyPage() {
  const navigate = useNavigate()
  const { logout, setUserId } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [pointProfile, setPointProfile] = useState<PointProfile | null>(null)
  const [ranking, setRanking] = useState<RankingUser[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [recentSongs, setRecentSongs] = useState<LearnedSong[]>([])
  const [checkinInfo, setCheckinInfo] = useState<CheckinResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [spotifyModalOpen, setSpotifyModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    gender: '',
    birth: '',
    profileImageUrl: ''
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=/mypage')
      return
    }
    loadAllData()
  }, [navigate])

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      const profileResponse = await getUserProfileAPI()
      const profileData = profileResponse.data?.data || profileResponse.data
      setProfile(profileData)

      // userId를 스토어에 저장
      if (profileData.userId) {
        setUserId(profileData.userId)
      }

      // 병렬로 데이터 로드
      const userId = profileData.userId
      const today = new Date().toISOString().split('T')[0]

      await Promise.allSettled([
        loadPointProfile(userId),
        loadRanking(),
        loadPlaylists(),
        loadRecentSongs(),
        loadCheckinInfo(userId, today)
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
    } catch (err) {
      console.error('랭킹 정보 로딩 실패:', err)
    }
  }

  const loadPlaylists = async () => {
    try {
      const response = await getUserPlaylistsAPI()
      setPlaylists(response.data.data)
    } catch (err) {
      console.error('플레이리스트 로딩 실패:', err)
    }
  }

  const loadRecentSongs = async () => {
    try {
      const response = await getRecentLearnedSongsAPI(1, 5)
      setRecentSongs(response.data.data.learnedSongs)
    } catch (err) {
      console.error('최근 학습 곡 로딩 실패:', err)
    }
  }

  const loadCheckinInfo = async (userId: number, date: string) => {
    try {
      const response = await getCheckinInfoAPI(userId, date)
      setCheckinInfo(response.data.data)
    } catch (err) {
      console.error('출석 정보 로딩 실패:', err)
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
        userId: profile.userId,
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
      await updateUserAPI(editForm)
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
        username: profile.username,
        gender: profile.gender || '',
        birth: profile.birth || '',
        profileImageUrl: profile.profileImageUrl || ''
      })
      setEditModalOpen(true)
    }
  }


  const getUserInitials = (username: string) => {
    return username.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">사용자 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">마이페이지</h1>
        <p className="text-muted-foreground">
          내 정보를 확인하고 관리하세요.
        </p>
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
              <Button
                onClick={loadAllData}
                variant="outline"
                size="sm"
              >
                다시 시도
              </Button>
              {error.includes('인증') && (
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  size="sm"
                >
                  다시 로그인
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {profile && (
        <div className="grid gap-6">
          {/* 사용자 정보 및 포인트 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>👤</span>
                  프로필 정보
                </div>
                <Button onClick={openEditModal} variant="outline" size="sm">
                  수정
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary">
                  {profile.profileImageUrl ? (
                    <img
                      src={profile.profileImageUrl}
                      alt={profile.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getUserInitials(profile.username)
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">이름</label>
                      <p className="text-lg font-semibold">{profile.username}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">이메일</label>
                      <p className="text-lg">{profile.email}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">포인트</label>
                      <p className="text-lg font-semibold text-yellow-600">
                        {pointProfile ? `${pointProfile.balance}P (${pointProfile.level})` : '로딩 중...'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">연속 출석일</label>
                      <p className="text-lg">
                        {checkinInfo ? `${checkinInfo.currentStreak}일` : '로딩 중...'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button onClick={handleCheckin} size="sm">
                        출석 체크
                      </Button>
                      {checkinInfo && (
                        <span className="text-sm text-muted-foreground">
                          총 {checkinInfo.totalDays}일 출석
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 포인트 랭킹 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🏆</span>
                포인트 랭킹 (TOP 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ranking.length > 0 ? (
                  ranking.map((user) => (
                    <div key={user.userId} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                        {user.rank}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">{user.username.charAt(0)}</span>
                        )}
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

          {/* 내 플레이리스트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎵</span>
                내 플레이리스트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <div key={playlist.playlistId} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                        {playlist.coverImageUrl ? (
                          <img
                            src={playlist.coverImageUrl}
                            alt={playlist.title}
                            className="w-full h-full rounded object-cover"
                          />
                        ) : (
                          <span className="text-lg">🎵</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{playlist.title}</p>
                        <p className="text-sm text-muted-foreground">{playlist.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">플레이리스트가 없습니다.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 최근 학습한 곡 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📚</span>
                최근 학습한 곡
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSongs.length > 0 ? (
                  recentSongs.map((song) => (
                    <div
                      key={song.learnedSongId}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/learned-songs/${song.learnedSongId}`)}
                    >
                      <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                        {song.albumImgUrl ? (
                          <img
                            src={song.albumImgUrl}
                            alt={song.title}
                            className="w-full h-full rounded object-cover"
                          />
                        ) : (
                          <span className="text-lg">🎵</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{song.title}</p>
                        <p className="text-sm text-muted-foreground">{song.artists}</p>
                        <Badge variant="secondary" className="text-xs">{song.level}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">학습한 곡이 없습니다.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 계정 관리 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚙️</span>
                계정 관리
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Spotify 연동</p>
                    <p className="text-sm text-muted-foreground">
                      음악 기반 학습을 위한 Spotify 계정 연동
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSpotifyModalOpen(true)}
                  >
                    설정
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* 로그아웃 */}
          <div className="flex justify-center pt-6">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              로그아웃
            </Button>
          </div>
        </div>
      )}

      {/* 프로필 수정 모달 */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>프로필 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">이름</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="gender">성별</Label>
              <select
                id="gender"
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </div>
            <div>
              <Label htmlFor="birth">생년월일</Label>
              <Input
                id="birth"
                type="date"
                value={editForm.birth}
                onChange={(e) => setEditForm({ ...editForm, birth: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="profileImage">프로필 이미지 URL</Label>
              <Input
                id="profileImage"
                value={editForm.profileImageUrl}
                onChange={(e) => setEditForm({ ...editForm, profileImageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <Separator />
            <div className="flex justify-between">
              <Button
                onClick={handleDeleteAccount}
                variant="destructive"
                size="sm"
              >
                회원 탈퇴
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleEditProfile}>
                  저장
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spotify 연동 모달 */}
      <Dialog open={spotifyModalOpen} onOpenChange={setSpotifyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Spotify 연동 설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Spotify 계정과 연동하여 음악 기반 학습 기능을 이용하실 수 있습니다.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  navigate('/spotify-setup')
                  setSpotifyModalOpen(false)
                }}
                className="flex-1"
              >
                Spotify 연동하기
              </Button>
              <Button
                variant="outline"
                onClick={() => setSpotifyModalOpen(false)}
              >
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 하단 네비게이션 */}
      <div className="mt-8 pt-6 border-t">
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="w-full"
        >
          메인으로 돌아가기
        </Button>
      </div>
    </div>
  )
}