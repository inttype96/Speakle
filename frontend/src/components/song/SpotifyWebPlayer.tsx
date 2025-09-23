import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ElasticSlider } from '@/components/ui/elastic-slider'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'
import { getAccessToken } from '@/store/auth'
import { getSpotifyTokenAPI } from '@/services/spotify'

// Spotify Web Playback SDK 타입 정의
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => SpotifyPlayer
    }
  }
}

interface SpotifyPlayer {
  addListener: (event: string, callback: (data: any) => void) => void
  removeListener: (event: string, callback?: (data: any) => void) => void
  connect: () => Promise<boolean>
  disconnect: () => void
  getCurrentState: () => Promise<SpotifyPlayerState | null>
  getVolume: () => Promise<number>
  nextTrack: () => Promise<void>
  pause: () => Promise<void>
  previousTrack: () => Promise<void>
  resume: () => Promise<void>
  seek: (position: number) => Promise<void>
  setName: (name: string) => Promise<void>
  setVolume: (volume: number) => Promise<void>
  togglePlay: () => Promise<void>
}

interface SpotifyPlayerState {
  context: {
    uri: string
    metadata: any
  }
  disallows: {
    pausing: boolean
    peeking_next: boolean
    peeking_prev: boolean
    resuming: boolean
    seeking: boolean
    skipping_next: boolean
    skipping_prev: boolean
  }
  paused: boolean
  position: number
  repeat_mode: number
  shuffle: boolean
  track_window: {
    current_track: SpotifyTrack
    next_tracks: SpotifyTrack[]
    previous_tracks: SpotifyTrack[]
  }
}

interface SpotifyTrack {
  id: string
  uri: string
  name: string
  duration_ms: number
  artists: Array<{ name: string; uri: string }>
  album: {
    name: string
    images: Array<{ url: string; height: number; width: number }>
  }
}

interface SpotifyWebPlayerProps {
  trackId: string
  trackName: string
  artistName: string
}

export default function SpotifyWebPlayer({ trackId, trackName, artistName }: SpotifyWebPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSDKReady, setIsSDKReady] = useState(false)


  // 시간 포맷팅 함수
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // 진행률 바 클릭 핸들러 (SDK API 사용)
  const handleProgressClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!player || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, clickX / rect.width))
    const newPosition = Math.floor(duration * percentage)

    try {
      await player.seek(newPosition)
      setPosition(newPosition)
      toast.success(`${formatTime(newPosition)}로 이동했습니다`)
    } catch (error) {
      console.error('위치 이동 실패:', error)
      toast.error('위치 이동에 실패했습니다')
    }
  }

  // Spotify SDK 초기화
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true

    document.body.appendChild(script)

    const initializePlayer = () => {
      const token = getAccessToken()
      if (!token) {
        toast.error('Spotify 로그인이 필요합니다')
        return
      }

      const spotifyPlayer = new window.Spotify.Player({
        name: 'Speakle Web Player',
        getOAuthToken: async (cb) => {
          try {
            const response = await getSpotifyTokenAPI()
            cb(response.data.accessToken)
          } catch (error) {
            console.error('Spotify 토큰 조회 실패:', error)
            toast.error('Spotify 토큰을 가져올 수 없습니다')
          }
        },
        volume: volume / 100
      })

      // 플레이어 이벤트 리스너
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id)
        setDeviceId(device_id)
        setIsSDKReady(true)
        toast.success('Spotify 플레이어가 준비되었습니다')
      })

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id)
        setIsSDKReady(false)
      })

      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) return

        setCurrentTrack(state.track_window.current_track)
        setIsPlaying(!state.paused)
        setPosition(state.position)
        setDuration(state.track_window.current_track.duration_ms)
      })

      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize', message)
        toast.error('Spotify 플레이어 초기화 실패')
      })

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate', message)
        toast.error('Spotify 인증 실패')
      })

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Failed to validate Spotify account', message)
        toast.error('Spotify Premium 계정이 필요합니다')
      })

      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Failed to perform playback', message)
        toast.error('재생 실패: ' + message)
      })

      // 플레이어 연결
      spotifyPlayer.connect()
      setPlayer(spotifyPlayer)
    }

    window.onSpotifyWebPlaybackSDKReady = initializePlayer

    return () => {
      if (player) {
        player.disconnect()
      }
      // 스크립트 정리
      const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [])

  // 실시간 position 업데이트
  useEffect(() => {
    if (!isPlaying || !duration) {
      return
    }

    const interval = setInterval(() => {
      setPosition((prev) => {
        const newPosition = prev + 100
        // 트랙 끝에 도달하면 정지
        if (newPosition >= duration) {
          setIsPlaying(false)
          return duration
        }
        return newPosition
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, duration])


  // 트랙 재생
  const playTrack = async (trackUri: string) => {
    if (!deviceId) {
      toast.error('플레이어가 준비되지 않았습니다')
      return
    }

    try {
      setLoading(true)
      const tokenResponse = await getSpotifyTokenAPI()
      const spotifyToken = tokenResponse.data.accessToken

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: [trackUri.startsWith('spotify:track:') ? trackUri : `spotify:track:${trackUri}`]
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${spotifyToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast.success(`${trackName} 재생을 시작했습니다`)
    } catch (error) {
      console.error('트랙 재생 실패:', error)
      toast.error('트랙 재생에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 재생/일시정지 토글
  const handlePlayPause = async () => {
    if (!player || loading) return

    setLoading(true)
    try {
      if (isPlaying) {
        await player.pause()
        toast.success('재생을 일시정지했습니다')
      } else {
        if (currentTrack?.id !== trackId) {
          await playTrack(trackId)
        } else {
          await player.resume()
          toast.success('재생을 재개했습니다')
        }
      }
    } catch (error) {
      console.error('재생/일시정지 실패:', error)
      toast.error('재생 제어에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }


  // 볼륨 변경 (SDK API 사용)
  const handleVolumeChange = async (volumeValue: number) => {
    setVolume(volumeValue)

    if (!player) return

    try {
      await player.setVolume(volumeValue / 100)
      setIsMuted(volumeValue === 0)
    } catch (error) {
      console.error('볼륨 조절 실패:', error)
      toast.error('볼륨 조절에 실패했습니다')
    }
  }

  // 음소거 토글 (SDK API 사용)
  const toggleMute = async () => {
    if (!player) return

    try {
      if (isMuted) {
        const newVolume = 50
        await player.setVolume(newVolume / 100)
        setVolume(newVolume)
        setIsMuted(false)
      } else {
        await player.setVolume(0)
        setVolume(0)
        setIsMuted(true)
      }
    } catch (error) {
      console.error('음소거 토글 실패:', error)
      toast.error('음소거 설정에 실패했습니다')
    }
  }

  if (!isSDKReady) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg">
        <div className="flex items-center justify-center w-12 h-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2"></div>
        </div>
        <div className="flex-1">
          <p className="font-medium text-muted-foreground">Spotify 플레이어 초기화 중...</p>
          <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg">
      {/* 재생/일시정지 버튼 */}
      <Button
        onClick={handlePlayPause}
        disabled={loading}
        size="lg"
        className="bg-green-500 text-white disabled:opacity-50"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2"></div>
        ) : isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </Button>

      {/* 트랙 정보 */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {currentTrack?.name || trackName}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {currentTrack?.artists[0]?.name || artistName}
        </p>
        {duration > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground font-mono min-w-[35px]">
              {formatTime(position)}
            </span>
            <div
              className="flex-1 rounded-full h-2 cursor-pointer hover:h-3 transition-all duration-200"
              onClick={handleProgressClick}
            >
              <div
                className="h-full rounded-full transition-all duration-300 hover:bg-green-400"
                style={{ width: `${Math.min((position / duration) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono min-w-[35px]">
              {formatTime(duration)}
            </span>
          </div>
        )}
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