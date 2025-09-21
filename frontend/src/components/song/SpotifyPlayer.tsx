import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ElasticSlider } from '@/components/ui/elastic-slider'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import {
  playTrackAPI,
  pausePlaybackAPI,
  resumePlaybackAPI,
  setVolumeAPI,
  getCurrentPlaybackAPI,
  type SpotifyPlaybackState
} from '@/services/spotify'
import { toast } from 'sonner'

interface SpotifyPlayerProps {
  trackId: string
  trackName: string
  artistName: string
}

export default function SpotifyPlayer({ trackId, trackName, artistName }: SpotifyPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [playbackState, setPlaybackState] = useState<SpotifyPlaybackState | null>(null)

  // 현재 재생 상태 조회
  const fetchPlaybackState = async () => {
    try {
      const response = await getCurrentPlaybackAPI()
      if (response.data) {
        const state = response.data as SpotifyPlaybackState
        setPlaybackState(state)
        setIsPlaying(state.isPlaying && state.trackId === trackId)
        setVolume(state.volumePercent)
      }
    } catch (error) {
      console.error('재생 상태 조회 실패:', error)
    }
  }

  // 컴포넌트 마운트 시 재생 상태 조회
  useEffect(() => {
    fetchPlaybackState()

    // 주기적으로 재생 상태 업데이트 (5초마다)
    const interval = setInterval(fetchPlaybackState, 5000)
    return () => clearInterval(interval)
  }, [trackId])

  const handlePlayPause = async () => {
    if (loading) return

    setLoading(true)
    try {
      if (isPlaying) {
        await pausePlaybackAPI()
        setIsPlaying(false)
        toast.success('재생을 일시정지했습니다')
      } else {
        // 현재 트랙이 재생 중인 트랙과 다르면 새로운 트랙 재생
        if (playbackState?.trackId !== trackId) {
          await playTrackAPI(trackId)
          toast.success(`${trackName} 재생을 시작했습니다`)
        } else {
          await resumePlaybackAPI()
          toast.success('재생을 재개했습니다')
        }
        setIsPlaying(true)
      }
    } catch (error: any) {
      console.error('재생/일시정지 실패:', error)
      const message = error.response?.data?.message || '재생 제어에 실패했습니다'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleVolumeChange = async (volumeValue: number) => {
    setVolume(volumeValue)

    try {
      await setVolumeAPI(volumeValue)
      setIsMuted(volumeValue === 0)
    } catch (error) {
      console.error('볼륨 조절 실패:', error)
      toast.error('볼륨 조절에 실패했습니다')
    }
  }

  const toggleMute = async () => {
    const newVolume = isMuted ? 50 : 0
    setVolume(newVolume)
    setIsMuted(!isMuted)

    try {
      await setVolumeAPI(newVolume)
    } catch (error) {
      console.error('음소거 설정 실패:', error)
      toast.error('음소거 설정에 실패했습니다')
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {/* 재생/일시정지 버튼 */}
      <Button
        onClick={handlePlayPause}
        disabled={loading}
        size="lg"
        className="bg-green-500 hover:bg-green-600 text-white"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </Button>

      {/* 트랙 정보 */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{trackName}</p>
        <p className="text-sm text-muted-foreground truncate">{artistName}</p>
      </div>

      {/* 볼륨 컨트롤 */}
      <div className="flex items-center gap-2 min-w-[120px]">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="p-2"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
        <ElasticSlider
          value={volume}
          onChange={handleVolumeChange}
          min={0}
          max={100}
          step={1}
          width={80}
          height={6}
          elasticity={0.4}
          damping={0.8}
        />
        <span className="text-xs text-muted-foreground w-8">
          {Math.round(volume)}%
        </span>
      </div>
    </div>
  )
}