import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, isAuthenticated } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/ui/data-table';
import { createPlaylistColumns } from '@/components/playlists/playlist-columns';
import Navbar from '@/components/common/navbar';
import Footer from '@/pages/common/footer';
import { playlistService, type Playlist, type CreatePlaylistRequest } from '@/services/playlist';
import { toast } from 'sonner';
import { Plus, Music, Trash2 } from 'lucide-react';

export default function PlaylistsPage() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [formData, setFormData] = useState<CreatePlaylistRequest>({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=/playlists');
      return;
    }
    loadPlaylists();
  }, [navigate]);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const data = await playlistService.getPlaylists();
      setPlaylists(data);
    } catch (error: any) {
      console.error('플레이리스트 목록 로딩 실패:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message;

      switch (status) {
        case 401:
          toast.error('로그인이 필요합니다.');
          navigate('/login?redirect=/playlists');
          break;
        default:
          toast.error(message || '플레이리스트를 불러올 수 없습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!formData.name.trim()) {
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
      setCreateLoading(true);
      const newPlaylist = await playlistService.createPlaylist(formData);
      setPlaylists(prev => [newPlaylist, ...prev]);
      toast.success('플레이리스트가 생성되었습니다.');
      setCreateDialogOpen(false);
      setFormData({
        name: '',
        description: ''
      });
    } catch (error: any) {
      console.error('플레이리스트 생성 실패:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message;

      switch (status) {
        case 400:
          toast.error(message || '입력 정보를 확인해주세요.');
          break;
        case 401:
          toast.error('로그인이 필요합니다.');
          navigate('/login?redirect=/playlists');
          break;
        default:
          toast.error('플레이리스트 생성에 실패했습니다.');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handlePlaylistView = (playlistId: string) => {
    navigate(`/playlists/${playlistId}`);
  };

  const handlePlaylistEdit = (playlist: Playlist) => {
    // 편집 기능은 상세 페이지에서 처리하므로 상세 페이지로 이동
    navigate(`/playlists/${playlist.id}`);
  };

  const handlePlaylistDelete = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPlaylist) return;

    try {
      setDeleteLoading(true);
      await playlistService.deletePlaylist(selectedPlaylist.id);
      setPlaylists(prev => prev.filter(p => p.id !== selectedPlaylist.id));
      toast.success('플레이리스트가 삭제되었습니다.');
      setDeleteDialogOpen(false);
      setSelectedPlaylist(null);
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
    }
  };

  const columns = createPlaylistColumns(handlePlaylistEdit, handlePlaylistDelete, handlePlaylistView, userId?.toString());

  if (loading) {
    return (
      <div className="bg-background text-foreground">
        <Navbar />
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="container mx-auto py-6 max-w-4xl">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">플레이리스트를 불러오는 중...</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <Navbar />

      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="container mx-auto py-6 max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">내 플레이리스트</h1>
              <p className="text-muted-foreground">
                나만의 음악 컬렉션을 만들어보세요
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="py-6 px-8 text-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  플레이리스트 만들기
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>새 플레이리스트 만들기</DialogTitle>
                  <DialogDescription>
                    새로운 플레이리스트를 만들어 좋아하는 음악을 모아보세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="플레이리스트 이름을 입력하세요"
                      maxLength={100}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="플레이리스트에 대한 설명을 입력하세요"
                      maxLength={500}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleCreatePlaylist}
                    disabled={createLoading || !formData.name.trim()}
                  >
                    {createLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        생성 중...
                      </div>
                    ) : (
                      '만들기'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {playlists.length > 0 ? (
            <DataTable
              columns={columns}
              data={playlists}
              searchKey="name"
              searchPlaceholder="플레이리스트 검색..."
            />
          ) : (
            <div className="text-center py-16">
              <div className="mb-6">
                <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">아직 플레이리스트가 없습니다</h3>
                <p className="text-muted-foreground mb-6">
                  첫 번째 플레이리스트를 만들어 좋아하는 음악을 모아보세요!
                </p>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      플레이리스트 만들기
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>새 플레이리스트 만들기</DialogTitle>
                      <DialogDescription>
                        새로운 플레이리스트를 만들어 좋아하는 음악을 모아보세요.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">이름 *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="플레이리스트 이름을 입력하세요"
                          maxLength={100}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">설명</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="플레이리스트에 대한 설명을 입력하세요"
                          maxLength={500}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                      >
                        취소
                      </Button>
                      <Button
                        onClick={handleCreatePlaylist}
                        disabled={createLoading || !formData.name.trim()}
                      >
                        {createLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            생성 중...
                          </div>
                        ) : (
                          '만들기'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>플레이리스트 삭제</DialogTitle>
            <DialogDescription>
              정말로 "{selectedPlaylist?.name}" 플레이리스트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  삭제 중...
                </div>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}