import { useState } from 'react';
import { playlistService } from '@/services/playlist';

export function usePlaylistSave() {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveToPlaylist = async (songId: string) => {
    setIsLoading(true);
    try {
      let playlists = await playlistService.getPlaylists();
      let customPlaylist = playlists.find(p => p.custom);

      // 커스텀 플레이리스트가 없으면 생성
      if (!customPlaylist) {
        customPlaylist = await playlistService.createPlaylist({
          name: 'My Favorites',
          description: 'Speakle에서 저장한 곡들'
        });
      }

      const uri = `spotify:track:${songId}`;
      await playlistService.addTracksToPlaylist(customPlaylist.id, [uri]);
      setIsSaved(true);
      alert('플레이리스트에 추가되었습니다!');
      return true;
    } catch (error) {
      console.error('Failed to add to playlist:', error);
      alert('플레이리스트 추가에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSaved,
    isLoading,
    saveToPlaylist,
  };
}