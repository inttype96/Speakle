import { useState, useEffect } from 'react';
import {
  addSongToOldestPlaylistService,
  getPlaylistMembershipService,
  removeSongFromAllPlaylistsService
} from '@/services/playlist';
import { toast } from 'sonner';

export function usePlaylistSave(songId?: string) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 노래가 사용자의 플레이리스트에 포함되어 있는지 확인
  const checkIfSongInPlaylists = async (songId: string) => {
    try {
      const response = await getPlaylistMembershipService(songId);
      if (response.status === 200) {
        // 하나라도 포함되어 있으면 true
        const isInAnyPlaylist = response.data.playlists.some((playlist: any) => playlist.containsSong);
        setIsSaved(isInAnyPlaylist);
      }
    } catch (error) {
      console.error('플레이리스트 멤버십 확인 실패:', error);
      // 에러가 발생해도 하트 상태는 그대로 유지
    }
  };

  // songId가 제공되면 자동으로 플레이리스트 포함 여부 확인
  useEffect(() => {
    if (songId) {
      checkIfSongInPlaylists(songId);
    }
  }, [songId]);

  const saveToPlaylist = async (songId: string) => {
    setIsLoading(true);
    try {
      if (isSaved) {
        // 이미 저장된 상태라면 삭제
        const response = await removeSongFromAllPlaylistsService(songId);

        if (response.status === 200) {
          setIsSaved(false);
          toast.success(response.message || '플레이리스트에서 삭제되었습니다!');
          return true;
        } else if (response.status === 404) {
          // 이미 삭제된 경우
          setIsSaved(false);
          toast.info('이미 플레이리스트에서 삭제된 노래입니다.');
          return false;
        }
      } else {
        // 저장되지 않은 상태라면 추가
        const response = await addSongToOldestPlaylistService(songId);

        if (response.status === 200) {
          setIsSaved(true);
          toast.success(response.message || '플레이리스트에 추가되었습니다!');
          return true;
        } else if (response.status === 409) {
          // 이미 추가된 경우에도 하트는 채워진 상태로 표시
          setIsSaved(true);
          toast.info('이미 플레이리스트에 포함된 노래입니다.');
          return false;
        } else if (response.status === 404) {
          toast.error('플레이리스트가 없습니다. 먼저 플레이리스트를 생성해주세요.');
          return false;
        }
      }
    } catch (error: any) {
      console.error('플레이리스트 토글 실패:', error);
      toast.error(error.response?.data?.message || '플레이리스트 작업 중 오류가 발생했습니다.');
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
