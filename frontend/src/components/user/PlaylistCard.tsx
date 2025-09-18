import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Playlist } from '@/services/mypage'

interface PlaylistCardProps {
  playlists: Playlist[]
}

export default function PlaylistCard({ playlists }: PlaylistCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🎵</span>
          내 플레이리스트
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {playlists.length > 0 ? (
            playlists.map((playlist) => (
              <div key={playlist.playlistId} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                  {playlist.coverImageUrl ? (
                    <img
                      src={playlist.coverImageUrl}
                      alt={playlist.title}
                      className="w-full h-full rounded object-cover"
                    />
                  ) : (
                    <span className="text-lg">🎵</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{playlist.title}</p>
                  <p className="text-sm text-muted-foreground">{playlist.description}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">플레이리스트가 없습니다.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}