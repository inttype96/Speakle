import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// icons
import { Plus, Music, Check, AlertCircle } from "lucide-react";

// services
import { addSongToPlaylistService, getPlaylistMembershipService } from "@/services/playlist";

// types
interface Playlist {
  playlistId: number;
  name: string;
  description: string;
  trackCount: number;
  containsSong: boolean;
}

interface PlaylistSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: string;
  songTitle?: string;
  onSuccess?: () => void;
}

export default function PlaylistSelectionModal({
  isOpen,
  onClose,
  songId,
  songTitle = "Unknown Song",
  onSuccess
}: PlaylistSelectionModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);

  // 모달이 열릴 때 플레이리스트 목록과 멤버십 정보 로딩
  useEffect(() => {
    if (isOpen && songId) {
      loadPlaylistMembership();
    }
  }, [isOpen, songId]);

  const loadPlaylistMembership = async () => {
    setLoading(true);
    try {
      const response = await getPlaylistMembershipService(songId);
      if (response.status === 200) {
        setPlaylists(response.data.playlists);
      }
    } catch (error) {
      console.error("플레이리스트 멤버십 로딩 실패:", error);
      toast.error("플레이리스트 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: number, playlistName: string) => {
    setAdding(playlistId);
    try {
      const response = await addSongToPlaylistService(songId, playlistId);

      if (response.status === 200) {
        toast.success(`"${songTitle}"가 "${playlistName}"에 추가되었습니다.`);

        // 플레이리스트 목록 업데이트
        setPlaylists(prev => prev.map(playlist =>
          playlist.playlistId === playlistId
            ? { ...playlist, containsSong: true, trackCount: playlist.trackCount + 1 }
            : playlist
        ));

        onSuccess?.();
      } else if (response.status === 409) {
        toast.info("이미 플레이리스트에 포함된 노래입니다.");
      }
    } catch (error: any) {
      console.error("플레이리스트 추가 실패:", error);
      toast.error(error.response?.data?.message || "플레이리스트 추가 중 오류가 발생했습니다.");
    } finally {
      setAdding(null);
    }
  };

  const handleClose = () => {
    setPlaylists([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            플레이리스트에 추가
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            "{songTitle}"를 추가할 플레이리스트를 선택하세요
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-96 mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                플레이리스트가 없습니다.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                먼저 플레이리스트를 생성해주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <div
                  key={playlist.playlistId}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">
                        {playlist.name}
                      </h4>
                      {playlist.containsSong && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          추가됨
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground truncate">
                        {playlist.description || "설명 없음"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        • {playlist.trackCount}곡
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={playlist.containsSong ? "secondary" : "default"}
                    disabled={playlist.containsSong || adding === playlist.playlistId}
                    onClick={() => handleAddToPlaylist(playlist.playlistId, playlist.name)}
                    className="ml-2 flex-shrink-0"
                  >
                    {adding === playlist.playlistId ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : playlist.containsSong ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        추가
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={handleClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
