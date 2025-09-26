import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, isAuthenticated } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import { createTrackColumns } from '@/components/playlists/track-columns';
import Navbar from '@/components/common/navbar';
import Footer from '@/pages/common/footer';
import { playlistService, type Playlist, type PlaylistTracksResponse, type UpdatePlaylistRequest, type DeleteTracksRequest } from '@/services/playlist';
import { toast } from 'sonner';
import { Music, Settings, Trash2, MoreVertical } from 'lucide-react';

export default function PlaylistDetailPage() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTracksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState<UpdatePlaylistRequest>({});

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=/playlists');
      return;
    }
    if (!playlistId) {
      navigate('/playlists');
      return;
    }
    loadPlaylist();
  }, [navigate, playlistId]);

  const loadPlaylist = async () => {
    if (!playlistId) return;

    try {
      setLoading(true);
      const [playlistData, tracksData] = await Promise.all([
        playlistService.getPlaylist(playlistId),
        playlistService.getPlaylistTracks(playlistId, { limit: 50 })
      ]);

      setPlaylist(playlistData);
      setTracks(tracksData);
      setFormData({
        name: playlistData.name,
        description: playlistData.description
      });
    } catch (error: any) {
      console.error('플레이리스트 로딩 실패:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message;

      switch (status) {
        case 401:
          toast.error('로그인이 필요합니다.');
          navigate('/login?redirect=/playlists');
          break;
        case 403:
          toast.error('플레이리스트에 접근할 권한이 없습니다.');
          navigate('/playlists');
          break;
        case 404:
          toast.error('플레이리스트를 찾을 수 없습니다.');
          navigate('/playlists');
          break;
        default:
          toast.error(message || '플레이리스트를 불러올 수 없습니다.');
          navigate('/playlists');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTracks = async () => {
    if (!playlistId || !tracks || tracksLoading) return;

    try {
      setTracksLoading(true);
      const newTracks = await playlistService.getPlaylistTracks(playlistId, {
        limit: 50,
        offset: tracks.items.length
      });

      setTracks(prev => prev ? {
        ...newTracks,
        items: [...prev.items, ...newTracks.items]
      } : newTracks);
    } catch (error: any) {
      console.error('추가 트랙 로딩 실패:', error);
      toast.error('더 많은 트랙을 불러올 수 없습니다.');
    } finally {
      setTracksLoading(false);
    }
  };

  const handleEditPlaylist = async () => {
    if (!playlist || !playlistId) return;

    if (!formData.name?.trim()) {
      toast.error('플레이리스트 이름을 입력해주세요.');
      return;
    }

    if (formData.name.length > 100) {
      toast.error('플레이리스트 이름은 100자 이하여야 합니다.');
      return;
    }

    if (formData.description && formData.description.length > 500) {
      toast.error('설명은 500자 이하여야 합니다.');
      return;
    }

    try {
      setEditLoading(true);
      await playlistService.updatePlaylist(playlistId, formData);
      setPlaylist(prev => prev ? { ...prev, ...formData } : null);
      toast.success('플레이리스트가 수정되었습니다.');
      setEditDialogOpen(false);
    } catch (error: any) {
      console.error('플레이리스트 수정 실패:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message;

      switch (status) {
        case 400:
          toast.error(message || '입력 정보를 확인해주세요.');
          break;
        case 401:
          toast.error('로그인이 필요합니다.');
          break;
        case 403:
          toast.error('플레이리스트를 수정할 권한이 없습니다.');
          break;
        case 404:
          toast.error('플레이리스트를 찾을 수 없습니다.');
          break;
        default:
          toast.error('플레이리스트 수정에 실패했습니다.');
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlist || !playlistId) return;

    try {
      setDeleteLoading(true);
      await playlistService.deletePlaylist(playlistId);
      toast.success('플레이리스트가 삭제되었습니다.');
      navigate('/playlists');
    } catch (error: any) {
      console.error('플레이리스트 삭제 실패:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message;

      switch (status) {
        case 401:
          toast.error('로그인이 필요합니다.');
          break;
        case 403:
          toast.error('플레이리스트를 삭제할 권한이 없습니다.');
          break;
        case 404:
          toast.error('플레이리스트를 찾을 수 없습니다.');
          break;
        default:
          toast.error(message || '플레이리스트 삭제에 실패했습니다.');
      }
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteTrack = async (trackUri: string) => {
    if (!playlistId || !tracks) return;

    // URI에서 trackId 추출 (spotify:track:id 또는 custom:track:id)
    const trackId = trackUri.split(':')[2] || 'unknown';

    const deleteRequest: DeleteTracksRequest = {
      tracks: [{ uri: trackUri }]
    };

    try {
      await playlistService.deleteTracksFromPlaylist(playlistId, trackId, deleteRequest);
      setTracks(prev => prev ? {
        ...prev,
        total: prev.total - 1,
        items: prev.items.filter(item => item.track.uri !== trackUri)
      } : null);
      toast.success('트랙이 삭제되었습니다.');
    } catch (error: any) {
      console.error('트랙 삭제 실패:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message;

      switch (status) {
        case 401:
          toast.error('로그인이 필요합니다.');
          break;
        case 403:
          toast.error('플레이리스트를 수정할 권한이 없습니다.');
          break;
        case 404:
          if (message?.includes('노래를 찾을 수 없습니다')) {
            toast.error('플레이리스트에서 해당 노래를 찾을 수 없습니다.');
          } else {
            toast.error('플레이리스트를 찾을 수 없습니다.');
          }
          break;
        default:
          toast.error(message || '트랙 삭제에 실패했습니다.');
      }
    }
  };

  const handleTrackView = (trackId: string) => {
    navigate(`/songs/${trackId}`);
  };

  const isOwner = playlist && userId && playlist.owner.id === userId.toString();
  const trackColumns = createTrackColumns(handleDeleteTrack, handleTrackView, !!isOwner);

  if (loading) {
    return (
      <div className="bg-background text-foreground font-sans min-h-screen">
        {/* Google Fonts Link */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <Navbar />
        <div aria-hidden className="h-16 md:h-20" />

        {/* 상단 여백 추가 */}
        <div className="h-8" />

        <div className="w-screen px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20" style={{ maxWidth: '65vw' }}>
          <div className="container mx-auto py-6 max-w-4xl">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B2199] mx-auto mb-4"></div>
                <p className="font-['Pretendard'] text-white/70">플레이리스트를 불러오는 중...</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="bg-background text-foreground font-sans min-h-screen">
        {/* Google Fonts Link */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <Navbar />
        <div aria-hidden className="h-16 md:h-20" />

        {/* 상단 여백 추가 */}
        <div className="h-8" />

        <div className="w-screen px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20" style={{ maxWidth: '65vw' }}>
          <div className="container mx-auto py-6 max-w-4xl">
            <div className="text-center py-16">
              <Music className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white font-['Pretendard']">플레이리스트를 찾을 수 없습니다</h3>
              <p className="text-white/70 mb-6 font-['Pretendard']">
                요청하신 플레이리스트가 존재하지 않거나 접근 권한이 없습니다.
              </p>
              <Button onClick={() => navigate('/playlists')} className="bg-[#4B2199]/90 hover:bg-[#4B2199] text-white font-['Pretendard'] font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
                플레이리스트 목록으로 돌아가기
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground font-sans min-h-screen">
      {/* Google Fonts Link */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />

      {/* 상단 여백 추가 */}
      <div className="h-8" />

      <div className="w-screen px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20" style={{ maxWidth: '65vw' }}>
        <div className="container mx-auto py-6 max-w-6xl">
          {/* 플레이리스트 헤더 */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="w-48 h-48 bg-[#4B2199]/20 rounded-lg flex items-center justify-center">
                <Music className="w-20 h-20 text-[#B5A6E0]" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold mb-3 text-white font-['Pretendard']">{playlist.name}</h1>
                    <p className="text-white/70 mb-4 font-['Pretendard']">
                      {playlist.description || '설명이 없습니다.'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-white/60 font-['Pretendard']">
                      <span>{playlist.owner.display_name}</span>
                      <span>•</span>
                      <span>{tracks?.total || 0}곡</span>
                    </div>
                  </div>
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="border-white/30 text-white hover:bg-white/10">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-lg">
                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)} className="text-white hover:bg-white/10 font-['Pretendard']">
                          <Settings className="w-4 h-4 mr-2" />
                          편집
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteDialogOpen(true)}
                          className="text-red-400 hover:bg-red-500/10 font-['Pretendard']"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 트랙 목록 */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-lg">
            <CardHeader>
              <CardTitle className="text-white font-['Pretendard']">트랙 ({tracks?.total || 0}곡)</CardTitle>
            </CardHeader>
            <CardContent>
              {tracks && tracks.items.length > 0 ? (
                <div>
                  <DataTable
                    columns={trackColumns}
                    data={tracks.items}
                    searchKey="track.name"
                    searchPlaceholder="트랙 검색..."
                  />

                  {tracks.next && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={loadMoreTracks}
                        disabled={tracksLoading}
                        className="border-white/30 text-white hover:bg-white/10 font-['Pretendard']"
                      >
                        {tracksLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            불러오는 중...
                          </div>
                        ) : (
                          '더 보기'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-white/50 mx-auto mb-4" />
                  <p className="text-white/70 font-['Pretendard']">아직 추가된 트랙이 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 편집 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-lg text-white">
          <DialogHeader>
            <DialogTitle className="font-['Pretendard'] text-white">플레이리스트 편집</DialogTitle>
            <DialogDescription className="font-['Pretendard'] text-white/70">
              플레이리스트 정보를 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name" className="font-['Pretendard'] text-white">이름 *</Label>
              <Input
                id="edit-name"
                value={formData.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="플레이리스트 이름을 입력하세요"
                maxLength={100}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-['Pretendard']"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="font-['Pretendard'] text-white">설명</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="플레이리스트에 대한 설명을 입력하세요"
                maxLength={500}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-['Pretendard']"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-white/30 text-white hover:bg-white/10 font-['Pretendard']"
            >
              취소
            </Button>
            <Button
              onClick={handleEditPlaylist}
              disabled={editLoading || !formData.name?.trim()}
              className="bg-[#4B2199]/90 hover:bg-[#4B2199] text-white font-['Pretendard'] font-medium"
            >
              {editLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  수정 중...
                </div>
              ) : (
                '수정'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-lg text-white">
          <DialogHeader>
            <DialogTitle className="font-['Pretendard'] text-white">플레이리스트 삭제</DialogTitle>
            <DialogDescription className="font-['Pretendard'] text-white/70">
              정말로 이 플레이리스트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlaylist}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  삭제 중...
                </div>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}