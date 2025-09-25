import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// icons
import { MoreHorizontal, Music, Check, AlertCircle } from "lucide-react";

// services
import {
  getPlaylistMembershipService,
  addSongToPlaylistService,
  getUserPlaylistsService
} from "@/services/playlist";

// types
interface Playlist {
  playlistId: number;
  name: string;
  description: string;
  trackCount: number;
  containsSong: boolean;
}

interface PlaylistDropdownProps {
  songId: string;
  songTitle?: string;
  onSuccess?: () => void;
}

export default function PlaylistDropdown({
  songId,
  songTitle = "Unknown Song",
  onSuccess
}: PlaylistDropdownProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      // 사용자의 플레이리스트 목록과 해당 노래의 멤버십 정보를 가져옵니다
      const [playlistsResponse, membershipResponse] = await Promise.all([
        getUserPlaylistsService(),
        getPlaylistMembershipService(songId)
      ]);

      if (playlistsResponse && membershipResponse.status === 200) {
        const userPlaylists = playlistsResponse; // getUserPlaylistsService는 직접 data를 반환
        const membershipData = membershipResponse.data.playlists;

        // 플레이리스트에 멤버십 정보를 추가 (백엔드 응답 구조에 맞게 수정)
        const playlistsWithMembership = userPlaylists.map((playlist: any) => {
          const membershipInfo = membershipData.find(
            (p: any) => p.playlistId === parseInt(playlist.id) // id를 숫자로 변환
          );
          return {
            playlistId: parseInt(playlist.id), // id 필드 사용
            name: playlist.name,
            description: playlist.description || "",
            trackCount: playlist.tracks?.total || 0, // tracks.total 사용
            containsSong: membershipInfo ? membershipInfo.containsSong : false
          };
        });

        setPlaylists(playlistsWithMembership);
      }
    } catch (error) {
      console.error("플레이리스트 로딩 실패:", error);
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
        setIsOpen(false);
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

  // 드롭다운이 열릴 때 플레이리스트 목록 로딩
  useEffect(() => {
    if (isOpen && songId) {
      loadPlaylists();
    }
  }, [isOpen, songId]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          플레이리스트에 추가
        </div>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="space-y-1 p-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-2 py-4 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                플레이리스트가 없습니다
              </p>
              <p className="text-xs text-muted-foreground">
                먼저 플레이리스트를 생성해주세요
              </p>
            </div>
          </div>
        ) : (
          playlists.map((playlist) => (
            <DropdownMenuItem
              key={playlist.playlistId}
              className="flex items-center gap-2"
              disabled={playlist.containsSong || adding === playlist.playlistId}
              onClick={() => handleAddToPlaylist(playlist.playlistId, playlist.name)}
            >
              {adding === playlist.playlistId ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : playlist.containsSong ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Music className="h-4 w-4" />
              )}

              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">
                  {playlist.name}
                </div>
                {playlist.description && (
                  <div className="truncate text-xs text-muted-foreground">
                    {playlist.description}
                  </div>
                )}
              </div>

              <span className="text-xs text-muted-foreground">
                {playlist.trackCount}곡
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
