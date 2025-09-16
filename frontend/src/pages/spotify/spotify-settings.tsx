import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, isAuthenticated } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getSpotifyStatusAPI,
  disconnectSpotifyAPI,
  getSpotifyProfileAPI
} from '@/services/spotify'
import { SpotifyConnect } from '@/components/spotify/spotify-connect'

interface SpotifyStatus {
  connected: boolean
  scope?: string
  expiresAtEpochSec?: number
}

interface SpotifyProfile {
  id: string
  display_name: string
  email: string
  country: string
}

export default function SpotifySettingsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<SpotifyStatus | null>(null)
  const [profile, setProfile] = useState<SpotifyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 인증 확인
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=/spotify-settings')
    }
  }, [navigate])

  // 상태 및 프로필 로드
  useEffect(() => {
    loadSpotifyInfo()
  }, [])

  const loadSpotifyInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      // 상태 확인
      const statusResponse = await getSpotifyStatusAPI()
      const statusData = statusResponse.data?.data || statusResponse.data
      setStatus(statusData)

      // 연결되어 있다면 프로필도 가져오기
      if (statusData?.connected) {
        try {
          const profileResponse = await getSpotifyProfileAPI()
          const profileData = profileResponse.data?.data || profileResponse.data
          setProfile(profileData)
        } catch (profileError) {
          console.warn('프로필 조회 실패:', profileError)
          // 프로필 조회 실패는 치명적이지 않으므로 에러 상태로 설정하지 않음
        }
      }
    } catch (err: any) {
      console.error('Spotify 정보 로드 실패:', err)
      setError('Spotify 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('정말로 Spotify 연결을 해제하시겠습니까?')) return

    try {
      setLoading(true)
      await disconnectSpotifyAPI()
      setStatus({ connected: false })
      setProfile(null)
      alert('Spotify 연결이 해제되었습니다.')
    } catch (err: any) {
      console.error('연결 해제 실패:', err)
      alert('연결 해제에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleSpotifyConnectSuccess = () => {
    loadSpotifyInfo() // 연결 성공 후 정보 새로고침
  }

  const formatExpirationTime = (epochSec: number) => {
    const date = new Date(epochSec * 1000)
    return date.toLocaleString('ko-KR')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-2xl">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Spotify 설정</h1>
        <p className="text-muted-foreground">
          Spotify 계정 연동을 관리하고 음악 기반 학습을 설정하세요.
        </p>
      </div>

      {error && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
            <Button
              onClick={loadSpotifyInfo}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
      )}

      {!status?.connected ? (
        <div className="space-y-6">
          <SpotifyConnect
            onSuccess={handleSpotifyConnectSuccess}
            onError={(error) => setError(error)}
          />

          <Card>
            <CardHeader>
              <CardTitle>Spotify 연동의 장점</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  좋아하는 음악으로 영어 학습
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  개인화된 플레이리스트 기반 학습
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  음악과 함께하는 발음 연습
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  실시간 재생 제어
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 연결 상태 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-500">🎵</span>
                Spotify 연결됨
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">연결 상태</span>
                  <Badge variant="default" className="bg-green-500">
                    연결됨
                  </Badge>
                </div>

                {profile && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">사용자</span>
                      <span className="text-sm">{profile.display_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">이메일</span>
                      <span className="text-sm">{profile.email}</span>
                    </div>
                  </>
                )}

                {status.expiresAtEpochSec && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">토큰 만료</span>
                    <span className="text-sm text-muted-foreground">
                      {formatExpirationTime(status.expiresAtEpochSec)}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                    size="sm"
                    disabled={loading}
                  >
                    Spotify 연결 해제
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 음악 학습 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>음악 학습 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">플레이리스트 기반 학습</p>
                    <p className="text-sm text-muted-foreground">
                      내 플레이리스트를 활용한 영어 학습
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    설정
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">음성 인식 연동</p>
                    <p className="text-sm text-muted-foreground">
                      음악과 함께하는 발음 연습
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    설정
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">학습 진도 추적</p>
                    <p className="text-sm text-muted-foreground">
                      음악별 학습 진도 관리
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    설정
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 음악 플레이어 테스트 */}
          <Card>
            <CardHeader>
              <CardTitle>음악 플레이어 테스트</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Spotify 연동이 제대로 작동하는지 확인해보세요.
              </p>
              <Button
                onClick={() => navigate('/spotify-player')}
                variant="outline"
                className="w-full"
              >
                음악 플레이어 테스트
              </Button>
            </CardContent>
          </Card>
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