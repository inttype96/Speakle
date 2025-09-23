import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ElasticSlider } from '@/components/ui/elastic-slider'
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack } from 'lucide-react'
import { toast } from 'sonner'
import { getAccessToken } from '@/store/auth'

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

  const volumeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

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
        getOAuthToken: (cb) => {
          const currentToken = getAccessToken()
          if (currentToken) {
            cb(currentToken)
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

  // 볼륨 변경 디바운싱
  const debouncedVolumeChange = useCallback(async (volumeValue: number) => {
    if (!player) return

    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current)
    }

    volumeTimeoutRef.current = setTimeout(async () => {
      try {
        await player.setVolume(volumeValue / 100)
        setIsMuted(volumeValue === 0)
      } catch (error) {
        console.error('볼륨 조절 실패:', error)
        toast.error('볼륨 조절에 실패했습니다')
      }
    }, 300)
  }, [player])

  // 트랙 재생
  const playTrack = async (trackUri: string) => {
    if (!deviceId) {
      toast.error('플레이어가 준비되지 않았습니다')
      return
    }

    try {
      setLoading(true)
      const token = getAccessToken()
      if (!token) {
        toast.error('인증 토큰이 없습니다')
        return
      }

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: [trackUri.startsWith('spotify:track:') ? trackUri : `spotify:track:${trackUri}`]
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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

  // 다음/이전 트랙
  const handleNext = async () => {
    if (!player) return
    try {
      await player.nextTrack()
    } catch (error) {
      console.error('다음 트랙 이동 실패:', error)
      toast.error('다음 트랙으로 이동할 수 없습니다')
    }
  }

  const handlePrevious = async () => {
    if (!player) return
    try {
      await player.previousTrack()
    } catch (error) {
      console.error('이전 트랙 이동 실패:', error)
      toast.error('이전 트랙으로 이동할 수 없습니다')
    }
  }

  // 볼륨 변경
  const handleVolumeChange = (volumeValue: number) => {
    setVolume(volumeValue)
    debouncedVolumeChange(volumeValue)
  }

  // 음소거 토글
  const toggleMute = () => {
    const newVolume = isMuted ? 50 : 0
    setVolume(newVolume)
    setIsMuted(!isMuted)
    debouncedVolumeChange(newVolume)
  }

  if (!isSDKReady) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex-1 text-center">
          <p className="text-sm text-muted-foreground">
            Spotify 플레이어를 초기화하는 중...
          </p>
          <div className="mt-2 animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {/* 이전 트랙 버튼 */}
      <Button
        onClick={handlePrevious}
        variant="ghost"
        size="sm"
        className="p-2"
      >
        <SkipBack className="w-4 h-4" />
      </Button>

      {/* 재생/일시정지 버튼 */}
      <Button
        onClick={handlePlayPause}
        disabled={loading}
        size="lg"
        className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </Button>

      {/* 다음 트랙 버튼 */}
      <Button
        onClick={handleNext}
        variant="ghost"
        size="sm"
        className="p-2"
      >
        <SkipForward className="w-4 h-4" />
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
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {Math.floor(position / 1000 / 60)}:{String(Math.floor((position / 1000) % 60)).padStart(2, '0')}
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className="bg-green-500 h-1 rounded-full transition-all duration-1000"
                style={{ width: `${(position / duration) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.floor(duration / 1000 / 60)}:{String(Math.floor((duration / 1000) % 60)).padStart(2, '0')}
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