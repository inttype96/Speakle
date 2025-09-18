import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect } from 'react'
import { getCurrentPlaybackAPI, pausePlaybackAPI, resumePlaybackAPI, skipToNextAPI, skipToPreviousAPI } from '@/services/spotify'
import { toast } from 'sonner'
import type { SpotifyStatusResponse, SpotifyProfileResponse } from '@/services/spotify'

interface SpotifyCardProps {
  spotifyStatus: SpotifyStatusResponse['data'] | null
  spotifyProfile: SpotifyProfileResponse['data'] | null
  onManageClick: () => void
}

export default function SpotifyCard({ spotifyStatus, spotifyProfile, onManageClick }: SpotifyCardProps) {
  const [currentTrack, setCurrentTrack] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadCurrentPlayback = async () => {
    if (!spotifyStatus?.connected) return

    try {
      const response = await getCurrentPlaybackAPI()
      if (response.data) {
        setCurrentTrack(response.data)
        setIsPlaying(response.data.is_playing || false)
      }
    } catch (err) {
      console.error('현재 재생 정보 로딩 실패:', err)
    }
  }

  useEffect(() => {
    if (spotifyStatus?.connected) {
      loadCurrentPlayback()
      // 5초마다 현재 재생 정보 업데이트
      const interval = setInterval(loadCurrentPlayback, 5000)
      return () => clearInterval(interval)
    }
  }, [spotifyStatus?.connected])

  const handlePlayPause = async () => {
    if (loading) return
    setLoading(true)

    try {
      if (isPlaying) {
        await pausePlaybackAPI()
        setIsPlaying(false)
        toast.success('재생이 일시정지되었습니다.')
      } else {
        await resumePlaybackAPI()
        setIsPlaying(true)
        toast.success('재생이 재개되었습니다.')
      }
    } catch (err: any) {
      toast.error('재생 제어에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    if (loading) return
    setLoading(true)

    try {
      await skipToNextAPI()
      toast.success('다음 트랙으로 이동했습니다.')
      setTimeout(loadCurrentPlayback, 1000) // 1초 후 정보 업데이트
    } catch (err: any) {
      toast.error('트랙 이동에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = async () => {
    if (loading) return
    setLoading(true)

    try {
      await skipToPreviousAPI()
      toast.success('이전 트랙으로 이동했습니다.')
      setTimeout(loadCurrentPlayback, 1000) // 1초 후 정보 업데이트
    } catch (err: any) {
      toast.error('트랙 이동에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎵</span>
          Spotify 연동
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-medium">연동 상태</p>
                <Badge
                  variant={spotifyStatus?.connected ? "default" : "secondary"}
                  className={spotifyStatus?.connected ? "bg-green-500 text-white" : ""}
                >
                  {spotifyStatus?.connected ? '연동됨' : '연동 안됨'}
                </Badge>
              </div>
              {spotifyStatus?.connected && spotifyProfile && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-1 p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">계정명:</span>
                      <span className="text-sm font-medium">
                        {spotifyProfile.display_name || spotifyProfile.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">이메일:</span>
                      <span className="text-sm">{spotifyProfile.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">국가:</span>
                      <span className="text-sm">{spotifyProfile.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">사용자 ID:</span>
                      <span className="text-sm font-mono text-xs">{spotifyProfile.id}</span>
                    </div>
                  </div>
                  {spotifyStatus.expiresAtEpochSec && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">토큰 만료:</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(spotifyStatus.expiresAtEpochSec * 1000).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                  {spotifyStatus.scope && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">권한:</span>
                      <span className="text-xs text-muted-foreground">
                        {spotifyStatus.scope.split(' ').join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 현재 재생 중인 음악 정보 */}
              {spotifyStatus?.connected && currentTrack && (
                <div className="space-y-3">
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">🎵 현재 재생 중</span>
                      <Badge variant={isPlaying ? "default" : "secondary"}>
                        {isPlaying ? '재생 중' : '일시정지'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-md">
                      {currentTrack.item?.album?.images?.[0]?.url && (
                        <img
                          src={currentTrack.item.album.images[0].url}
                          alt="앨범 커버"
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {currentTrack.item?.name || '알 수 없는 트랙'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {currentTrack.item?.artists?.map((a: any) => a.name).join(', ') || '알 수 없는 아티스트'}
                        </p>
                      </div>
                    </div>

                    {/* 플레이어 컨트롤 */}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        onClick={handlePrevious}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        ⏮️
                      </Button>
                      <Button
                        onClick={handlePlayPause}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        {loading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
                      </Button>
                      <Button
                        onClick={handleNext}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        ⏭️
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!spotifyStatus?.connected && (
                <p className="text-sm text-muted-foreground">
                  음악 기반 학습을 위한 Spotify 계정 연동
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onManageClick}
            >
              {spotifyStatus?.connected ? '관리' : '연동하기'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}