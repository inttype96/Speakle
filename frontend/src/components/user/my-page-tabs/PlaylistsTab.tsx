import PlaylistCard from '@/components/user/PlaylistCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Playlist } from '@/services/mypage'
import TwoColumnTabLayout from './TwoColumnTabLayout'

interface PlaylistsTabProps {
  playlists: Playlist[]
  error: boolean
}

export default function PlaylistsTab({ playlists, error }: PlaylistsTabProps) {
  return (
    <TwoColumnTabLayout
      left={<PlaylistCard playlists={playlists} error={error} />}
      right={
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎯</span>
              플레이리스트 관리
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-primary">{playlists.length}</div>
                <div className="text-sm text-muted-foreground">내 플레이리스트</div>
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground text-center">
                좋아하는 곡들을 모아서 체계적으로 학습하세요.
              </div>
            </div>
          </CardContent>
        </Card>
      }
    />
  )
}