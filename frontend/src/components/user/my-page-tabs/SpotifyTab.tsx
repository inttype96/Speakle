import SpotifyCard from '@/components/user/SpotifyCard'
import type {
  SpotifyStatusResponse,
  SpotifyProfileResponse
} from '@/services/spotify'

interface SpotifyTabProps {
  spotifyStatus: SpotifyStatusResponse | null
  spotifyProfile: SpotifyProfileResponse | null
  onConnect: () => void
  onDisconnect: () => void
}

export default function SpotifyTab({
  spotifyStatus,
  spotifyProfile,
  onConnect,
  onDisconnect
}: SpotifyTabProps) {
  return (
    <div className="w-full">
      <SpotifyCard
        spotifyStatus={spotifyStatus}
        spotifyProfile={spotifyProfile}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
    </div>
  )
}