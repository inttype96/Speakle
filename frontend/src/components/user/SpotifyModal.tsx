import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SpotifyStatusResponse, SpotifyProfileResponse } from '@/services/spotify'

interface SpotifyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spotifyStatus: SpotifyStatusResponse['data'] | null
  spotifyProfile: SpotifyProfileResponse['data'] | null
  onConnect: () => void
  onDisconnect: () => void
}

export default function SpotifyModal({
  open,
  onOpenChange,
  spotifyStatus,
  spotifyProfile,
  onConnect,
  onDisconnect
}: SpotifyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Spotify 연동 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {spotifyStatus?.connected ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-500 text-white">연동됨</Badge>
                </div>
                {spotifyProfile && (
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {spotifyProfile.display_name || spotifyProfile.id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {spotifyProfile.email}
                    </p>
                    {spotifyStatus.expiresAtEpochSec && (
                      <p className="text-xs text-muted-foreground">
                        토큰 만료: {new Date(spotifyStatus.expiresAtEpochSec * 1000).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={onDisconnect}
                  variant="destructive"
                  className="flex-1"
                >
                  연동 해제
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-input text-foreground hover:bg-accent"
                >
                  닫기
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Spotify 계정과 연동하여 음악 기반 학습 기능을 이용하실 수 있습니다.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={onConnect}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Spotify 연동하기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-input text-foreground hover:bg-accent"
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}