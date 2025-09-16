import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, isAuthenticated } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUserProfileAPI } from '@/services/auth'
import type { UserProfile } from '@/types/auth'
import { AxiosError } from 'axios'

export default function MyPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=/mypage')
      return
    }
    loadUserProfile()
  }, [navigate])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getUserProfileAPI()
      const profileData = response.data?.data || response.data
      setProfile(profileData)
    } catch (err: any) {
      console.error('사용자 정보 조회 실패:', err)

      if (err instanceof AxiosError) {
        const status = err.response?.status
        const message = err.response?.data?.message || '사용자 정보를 불러오는데 실패했습니다.'

        switch (status) {
          case 401:
            setError('인증이 만료되었습니다. 다시 로그인해주세요.')
            break
          case 404:
            setError('사용자 정보를 찾을 수 없습니다.')
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
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (confirm('정말로 로그아웃하시겠습니까?')) {
      logout()
      navigate('/login')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getGenderText = (gender?: string) => {
    switch (gender) {
      case 'male':
        return '남성'
      case 'female':
        return '여성'
      default:
        return '미설정'
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
                onClick={loadUserProfile}
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
          {/* 프로필 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👤</span>
                프로필 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.profileImageUrl} alt={profile.username} />
                  <AvatarFallback className="text-lg">
                    {getUserInitials(profile.username)}
                  </AvatarFallback>
                </Avatar>

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

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">성별</label>
                      <p className="text-lg">{getGenderText(profile.gender)}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">생년월일</label>
                      <p className="text-lg">
                        {profile.birth ? formatDate(profile.birth) : '미설정'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">가입일</label>
                    <p className="text-lg">{formatDate(profile.createdAt)}</p>
                  </div>
                </div>
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
                    <p className="font-medium">프로필 수정</p>
                    <p className="text-sm text-muted-foreground">
                      이름, 프로필 사진 등을 변경하세요.
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    수정
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">비밀번호 변경</p>
                    <p className="text-sm text-muted-foreground">
                      보안을 위해 주기적으로 비밀번호를 변경하세요.
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    변경
                  </Button>
                </div>

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
                    onClick={() => navigate('/spotify-settings')}
                  >
                    설정
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 학습 통계 카드 (추후 확장 가능) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📊</span>
                학습 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  학습 통계 기능이 곧 추가될 예정입니다.
                </p>
                <Badge variant="secondary">준비 중</Badge>
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