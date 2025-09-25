import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSpotifyPlayer } from '@/contexts/SpotifyPlayerContext'
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
  onTimeUpdate?: (currentTime: number, isPlaying: boolean) => void
  startTime?: number // 시작 시간 (밀리초)
  endTime?: number   // 종료 시간 (밀리초)
  autoPlay?: boolean // 자동 재생 여부 (수정(소연))
}

export default function SpotifyWebPlayer({ trackId, trackName, artistName, onTimeUpdate, startTime, endTime, autoPlay = false }: SpotifyWebPlayerProps) {
  const { shouldStopPlayer, setIsPlaying: setGlobalIsPlaying } = useSpotifyPlayer();
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

  // startTime과 endTime 입력 검증
  const validateTimeValues = useCallback(() => {
    const errors: string[] = []
    
    if (startTime !== undefined) {
      if (typeof startTime !== 'number' || isNaN(startTime)) {
        errors.push('startTime은 유효한 숫자여야 합니다')
      } else if (startTime < 0) {
        errors.push('startTime은 0 이상이어야 합니다')
      }
    }
    
    if (endTime !== undefined) {
      if (typeof endTime !== 'number' || isNaN(endTime)) {
        errors.push('endTime은 유효한 숫자여야 합니다')
      } else if (endTime < 0) {
        errors.push('endTime은 0 이상이어야 합니다')
      }
    }
    
    if (startTime !== undefined && endTime !== undefined) {
      if (startTime >= endTime) {
        errors.push('endTime은 startTime보다 커야 합니다')
      }
    }
    
    if (errors.length > 0) {
      console.warn('SpotifyWebPlayer 시간 값 검증 실패:', errors.join(', '))
      return false
    }
    
    return true
  }, [startTime, endTime])

  // 검증된 시간 값들
  const validatedStartTime = useMemo(() => {
    return validateTimeValues() ? startTime : undefined
  }, [startTime, validateTimeValues])
  
  const validatedEndTime = useMemo(() => {
    return validateTimeValues() ? endTime : undefined
  }, [endTime, validateTimeValues])


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
        const playing = !state.paused
        setIsPlaying(playing)
        setGlobalIsPlaying(playing)  // 전역 상태도 업데이트
        setPosition(state.position)
        setDuration(state.track_window.current_track.duration_ms)

        // endTime이 설정되어 있고 도달하면 정지
        if (validatedEndTime && !state.paused && state.position >= validatedEndTime) {
          spotifyPlayer.pause()
          setIsPlaying(false)
          setGlobalIsPlaying(false)  // 전역 상태도 업데이트
          onTimeUpdate?.(validatedEndTime, false)
          return
        }

        // 상위 컴포넌트에 시간 업데이트 알림
        onTimeUpdate?.(state.position, !state.paused)
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

  // 실제 Spotify 재생 위치로 position 업데이트
  useEffect(() => {
    if (!isPlaying || !duration || !player) {
      return
    }

    const interval = setInterval(async () => {
      try {
        // 실제 Spotify 재생 상태 가져오기
        const state = await player.getCurrentState()
        if (!state || state.paused) {
          setIsPlaying(false)
          return
        }

        const realPosition = state.position
        setPosition(realPosition)

        // endTime이 설정되어 있고 도달하면 정지
        if (validatedEndTime && realPosition >= validatedEndTime) {
          await player.pause()
          setIsPlaying(false)
          onTimeUpdate?.(validatedEndTime, false)
          return
        }

        // 트랙 끝에 도달하면 정지
        if (realPosition >= duration) {
          setIsPlaying(false)
          onTimeUpdate?.(duration, false)
          return
        }

        // 상위 컴포넌트에 실제 재생 시간 알림
        onTimeUpdate?.(realPosition, true)

      } catch (error) {
        console.error('재생 위치 업데이트 실패:', error)
        // 에러 시 기존 방식으로 폴백
        setPosition((prev) => {
          const newPosition = prev + 100
          onTimeUpdate?.(newPosition, true)
          return newPosition
        })
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, duration, validatedEndTime, onTimeUpdate, player])

  // shouldStopPlayer가 true일 때 플레이어 정지 (API가 실패했을 경우를 위한 백업)
  useEffect(() => {
    if (shouldStopPlayer && player && isPlaying) {
      console.log('🔍 SpotifyWebPlayer backup stop check:', { shouldStopPlayer, hasPlayer: !!player, isPlaying });

      const stopPlayer = async () => {
        try {
          console.log('🛑 BACKUP: Stopping Spotify player via SDK')

          // UI 상태 즉시 업데이트
          setIsPlaying(false)
          setGlobalIsPlaying(false)
          setPosition(0)
          onTimeUpdate?.(0, false)

          // SDK로 정지 (백업용)
          await player.pause()
          console.log('✅ SDK backup pause successful')
        } catch (error) {
          console.error('SDK backup pause failed:', error)
        }
      }

      stopPlayer()
    }
  }, [shouldStopPlayer, player, isPlaying, onTimeUpdate, setGlobalIsPlaying])

  // autoPlay 로직 (수정(소연))
  useEffect(() => {
    if (autoPlay && isSDKReady && deviceId && player && !isPlaying) {
      console.log('🎵 AutoPlay triggered:', { trackId, validatedStartTime })
      const timeout = setTimeout(() => {
        playTrack(trackId, validatedStartTime)
      }, 500) // 플레이어가 완전히 준비될 시간 확보

      return () => clearTimeout(timeout)
    }
  }, [autoPlay, isSDKReady, deviceId, player, trackId, validatedStartTime, isPlaying])

  // 트랙 재생
  const playTrack = async (trackUri: string, seekTo?: number) => {
    if (!deviceId) {
      toast.error('플레이어가 준비되지 않았습니다')
      return
    }

    try {
      setLoading(true)
      const tokenResponse = await getSpotifyTokenAPI()
      const spotifyToken = tokenResponse.data.accessToken

      const playBody: any = {
        uris: [trackUri.startsWith('spotify:track:') ? trackUri : `spotify:track:${trackUri}`]
      }

      // startTime이 있으면 해당 위치로 이동
      if (seekTo !== undefined) {
        playBody.position_ms = seekTo
      }

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify(playBody),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${spotifyToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const message = seekTo !== undefined 
        ? `${trackName} 재생을 ${Math.floor(seekTo / 1000)}초부터 시작했습니다`
        : `${trackName} 재생을 시작했습니다`
      toast.success(message)
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
        setIsPlaying(false)
        setGlobalIsPlaying(false)
        toast.success('재생을 일시정지했습니다')
      } else {
        // 새로운 트랙이거나, startTime이 설정되어 있고 현재 위치가 startTime과 다를 때
        const shouldSeekToStart = currentTrack?.id !== trackId ||
          (validatedStartTime !== undefined && Math.abs(position - validatedStartTime) > 1000) // 1초 이상 차이날 때

        if (shouldSeekToStart) {
          // startTime 위치에서 재생
          await playTrack(trackId, validatedStartTime)
        } else {
          // 같은 트랙이고 위치가 맞으면 현재 위치에서 재생
          await player.resume()
          setIsPlaying(true)
          setGlobalIsPlaying(true)
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
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-center w-12 h-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
        <div className="flex-1">
          <p className="font-medium text-muted-foreground">Spotify 플레이어 초기화 중...</p>
          <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {/* 재생/일시정지 버튼 */}
      <Button
        onClick={handlePlayPause}
        disabled={loading}
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
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
              className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 cursor-pointer hover:h-3 transition-all duration-200"
              onClick={handleProgressClick}
            >
              <div
                className="bg-primary hover:bg-primary/90 h-full rounded-full transition-all duration-300"
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
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
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