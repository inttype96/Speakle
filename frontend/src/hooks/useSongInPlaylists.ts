import { useState, useEffect, useCallback } from 'react';
// import { isSongInUserPlaylists, type UseSongInPlaylistsResult } from '@/services/playlist';

/**
 * 특정 노래가 사용자의 플레이리스트에 포함되어 있는지 확인하는 React Hook
 *
 * @param songId - 확인할 노래의 ID
 * @param autoFetch - 컴포넌트 마운트 시 자동으로 데이터를 가져올지 여부 (기본: true)
 * @returns 노래가 플레이리스트에 포함되어 있는지와 관련 정보들
 */
export function useSongInPlaylists(
  songId: string | null,
  autoFetch: boolean = true
): UseSongInPlaylistsResult {
  const [isIncluded, setIsIncluded] = useState(false);
  const [playlists, setPlaylists] = useState<Array<{ playlistId: number; title: string; addedAt: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!songId) {
      setIsIncluded(false);
      setPlaylists([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await isSongInUserPlaylists(songId);
      setIsIncluded(result.isIncluded);
      setPlaylists(result.playlists);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsIncluded(false);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    if (autoFetch && songId) {
      fetchData();
    }
  }, [fetchData, autoFetch, songId]);

  return {
    isIncluded,
    playlists,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * 여러 노래들이 사용자의 플레이리스트에 포함되어 있는지 한번에 확인하는 Hook
 *
 * @param songIds - 확인할 노래 ID들의 배열
 * @returns 각 노래의 플레이리스트 포함 여부 정보
 */
export function useMultipleSongsInPlaylists(songIds: string[]) {
  const [songsStatus, setSongsStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMultipleData = useCallback(async () => {
    if (songIds.length === 0) {
      setSongsStatus({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        songIds.map(async (songId) => {
          const result = await isSongInUserPlaylists(songId);
          return { songId, isIncluded: result.isIncluded };
        })
      );

      const statusMap = results.reduce((acc, { songId, isIncluded }) => {
        acc[songId] = isIncluded;
        return acc;
      }, {} as Record<string, boolean>);

      setSongsStatus(statusMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setSongsStatus({});
    } finally {
      setLoading(false);
    }
  }, [songIds]);

  useEffect(() => {
    fetchMultipleData();
  }, [fetchMultipleData]);

  return {
    songsStatus,
    loading,
    error,
    refetch: fetchMultipleData,
    isSongIncluded: (songId: string) => songsStatus[songId] || false
  };
}