import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, isAuthenticated } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/common/navbar';
import Footer from '@/pages/common/footer';
import { playlistService, type Playlist, type CreatePlaylistRequest } from '@/services/playlist';
import { toast } from 'sonner';
import { Plus, Music, Users, Lock, Globe } from 'lucide-react';

export default function PlaylistsPage() {
  const navigate = useNavigate();
  const { } = useAuthStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePlaylistRequest>({
    name: '',
    description: '',
    public: true,
    collaborative: false
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

    if (formData.description && formData.description.length > 300) {
      toast.error('설명은 300자 이하여야 합니다.');
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
        description: '',
        public: true,
        collaborative: false
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

  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/playlists/${playlistId}`);
  };

  if (loading) {
    return (
      <div className="bg-background text-foreground">
        <Navbar />
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="container mx-auto py-6 max-w-6xl">
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
        <div className="container mx-auto py-6 max-w-6xl">
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
                      maxLength={300}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="public">공개 플레이리스트</Label>
                    <Switch
                      id="public"
                      checked={formData.public}
                      onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, public: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="collaborative">공동 편집 허용</Label>
                    <Switch
                      id="collaborative"
                      checked={formData.collaborative}
                      onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, collaborative: checked }))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {playlists.map((playlist) => (
                <Card
                  key={playlist.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handlePlaylistClick(playlist.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center mb-3">
                      <Music className="w-12 h-12 text-primary" />
                    </div>
                    <CardTitle className="text-lg line-clamp-1">{playlist.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {playlist.public ? (
                        <Globe className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      <span>{playlist.public ? '공개' : '비공개'}</span>
                      {playlist.collaborative && (
                        <>
                          <span>•</span>
                          <Users className="w-4 h-4" />
                          <span>공동편집</span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {playlist.description || '설명이 없습니다.'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {playlist.tracks.total}곡
                      </span>
                      <span className="text-muted-foreground">
                        {playlist.owner.display_name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                          maxLength={300}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="public">공개 플레이리스트</Label>
                        <Switch
                          id="public"
                          checked={formData.public}
                          onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, public: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="collaborative">공동 편집 허용</Label>
                        <Switch
                          id="collaborative"
                          checked={formData.collaborative}
                          onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, collaborative: checked }))}
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

      <Footer />
    </div>
  );
}