import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getCurrentPlaybackAPI,
  playAPI,
  pauseAPI,
  nextTrackAPI,
  previousTrackAPI
} from '@/services/spotify'

interface CurrentPlayback {
  is_playing: boolean
  item?: {
    name: string
    artists: Array<{ name: string }>
    album: { name: string; images: Array<{ url: string }> }
    duration_ms: number
  }
  progress_ms: number
}

interface SpotifyPlayerProps {
  className?: string
  onError?: (error: string) => void
}

export function SpotifyPlayer({ className, onError }: SpotifyPlayerProps) {
  const [playback, setPlayback] = useState<CurrentPlayback | null>(null)
  const [loading, setLoading] = useState(false)
  const [controlLoading, setControlLoading] = useState<string | null>(null)

  useEffect(() => {
    loadPlayback()
  }, [])

  const loadPlayback = async () => {
    try {
      setLoading(true)
      const response = await getCurrentPlaybackAPI()
      const data = response.data?.data || response.data
      setPlayback(data)
    } catch (err: any) {
      console.error('재생 정보 조회 실패:', err)
      onError?.('재생 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePlayControl = async (action: 'play' | 'pause' | 'next' | 'previous') => {
    try {
      setControlLoading(action)

      let apiCall
      switch (action) {
        case 'play':
          apiCall = playAPI()
          break
        case 'pause':
          apiCall = pauseAPI()
          break
        case 'next':
          apiCall = nextTrackAPI()
          break
        case 'previous':
          apiCall = previousTrackAPI()
          break
      }

      await apiCall

      // 재생 정보 업데이트 (1초 후)
      setTimeout(() => loadPlayback(), 1000)
    } catch (err: any) {
      console.error(`${action} 실패:`, err)
      onError?.(`재생 제어에 실패했습니다: ${action}`)
    } finally {
      setControlLoading(null)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>현재 재생 중</span>
          <Button
            onClick={loadPlayback}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            새로고침
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {playback?.item ? (
          <div className="space-y-4">
            {/* 앨범 커버 및 곡 정보 */}
            <div className="flex gap-4">
              {playback.item.album?.images?.[0] && (
                <img
                  src={playback.item.album.images[0].url}
                  alt="Album cover"
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{playback.item.name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {playback.item.artists.map(artist => artist.name).join(', ')}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {playback.item.album.name}
                </p>
              </div>
              <div className="text-right">
                <Badge variant={playback.is_playing ? 'default' : 'secondary'}>
                  {playback.is_playing ? '재생 중' : '일시정지'}
                </Badge>
              </div>
            </div>

            {/* 진행률 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatDuration(playback.progress_ms)}</span>
                <span>{formatDuration(playback.item.duration_ms)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-primary h-1 rounded-full transition-all"
                  style={{
                    width: `${(playback.progress_ms / playback.item.duration_ms) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* 재생 컨트롤 */}
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={() => handlePlayControl('previous')}
                disabled={!!controlLoading}
                variant="outline"
                size="sm"
              >
                ⏮
              </Button>
              <Button
                onClick={() => handlePlayControl(playback.is_playing ? 'pause' : 'play')}
                disabled={!!controlLoading}
                size="sm"
                className="px-6"
              >
                {controlLoading === 'play' || controlLoading === 'pause'
                  ? '...'
                  : playback.is_playing ? '⏸' : '▶'}
              </Button>
              <Button
                onClick={() => handlePlayControl('next')}
                disabled={!!controlLoading}
                variant="outline"
                size="sm"
              >
                ⏭
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              현재 재생 중인 음악이 없습니다
            </p>
            <p className="text-sm text-muted-foreground">
              Spotify 앱에서 음악을 재생해보세요
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}