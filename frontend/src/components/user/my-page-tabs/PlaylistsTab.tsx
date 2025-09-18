import PlaylistCard from '@/components/user/PlaylistCard'
import type { Playlist } from '@/services/mypage'

interface PlaylistsTabProps {
  playlists: Playlist[]
  error: boolean
}

export default function PlaylistsTab({ playlists, error }: PlaylistsTabProps) {
  return (
    <div className="w-full">
      <PlaylistCard playlists={playlists} error={error} />
    </div>
  )
}