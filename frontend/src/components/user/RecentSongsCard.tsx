import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LearnedSong } from '@/services/mypage'

interface RecentSongsCardProps {
  recentSongs: LearnedSong[]
  error?: boolean
}

export default function RecentSongsCard({ recentSongs, error }: RecentSongsCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📚</span>
          최근 학습한 곡
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {error ? (
            <div className="text-center text-muted-foreground py-4">
              <p>최근 학습 곡을 불러올 수 없습니다.</p>
              <p className="text-sm">서버에 일시적인 문제가 있을 수 있습니다.</p>
            </div>
          ) : recentSongs.length > 0 ? (
            recentSongs.map((song) => (
              <div
                key={song.learnedSongId}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                  {song.albumImgUrl ? (
                    <img
                      src={song.albumImgUrl}
                      alt={song.title}
                      className="w-full h-full rounded object-cover"
                    />
                  ) : (
                    <span className="text-lg">🎵</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{song.title}</p>
                  <p className="text-sm text-muted-foreground">{song.artists.replace(/[\[\]']/g, '')}</p>
                  <Badge variant="secondary" className="text-xs">{song.level}</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">학습한 곡이 없습니다.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
