import { http } from './http';

// 플레이리스트 관련 타입 정의
export interface PlaylistOwner {
  id: string;
  display_name: string;
  uri: string;
}

export interface PlaylistTracks {
  href: string;
  total: number;
}

export interface PlaylistImage {
  url: string;
}

export interface PlaylistExternalUrls {
  spotify: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  owner: PlaylistOwner;
  tracks: PlaylistTracks;
  images: PlaylistImage[];
  uri: string;
  external_urls: PlaylistExternalUrls;
  custom: boolean;
  spotify_synced: boolean;
}

// 플레이리스트 생성 요청 타입
export interface CreatePlaylistRequest {
  name: string;
  description?: string;
}

// 플레이리스트 수정 요청 타입
export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
}

// 플레이리스트 삭제 응답 타입
export interface DeletePlaylistResponse {
  success: boolean;
  message: string;
  playlist_id: string;
}

// 트랙 관련 타입
export interface Artist {
  name: string;
}

export interface Album {
  name: string;
  images: PlaylistImage[];
}

export interface Track {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  duration_formatted: string;
  artists: Artist[];
  album: Album;
}

export interface PlaylistTrackItem {
  added_at: string;
  track: Track;
}

export interface PlaylistTracksResponse {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: PlaylistTrackItem[];
}

// 트랙 삭제 요청 타입
export interface DeleteTracksRequest {
  tracks: {
    uri: string;
  }[];
  snapshot_id?: string;
}

export interface DeleteTracksResponse {
  snapshot_id: string;
  custom: boolean;
  message: string;
}

// 플레이리스트 멤버십 관련 타입
export interface PlaylistMembership {
  playlistId: number;
  name: string;
  description: string;
  trackCount: number;
  containsSong: boolean;
}

export interface PlaylistMembershipResponse {
  status: number;
  message: string;
  data: {
    songId: string;
    playlists: PlaylistMembership[];
    totalPlaylists: number;
    playlistsWithSong: number;
  };
}

// 노래 추가 응답 타입
export interface AddSongResponse {
  status: number;
  message: string;
  data?: {
    playlistId: number;
    playlistName: string;
    songId: string;
    addedAt?: string;
    success?: boolean;
    alreadyAdded?: boolean;
  };
}

// API 함수들
export const playlistService = {
  // 플레이리스트 목록 조회
  async getPlaylists(): Promise<Playlist[]> {
    const response = await http.get<Playlist[]>('/playlists');
    return response.data;
  },

  // 플레이리스트 생성
  async createPlaylist(data: CreatePlaylistRequest): Promise<Playlist> {
    const response = await http.post<Playlist>('/playlists/create', data);
    return response.data;
  },

  // 플레이리스트 상세 조회
  async getPlaylist(playlistId: string): Promise<Playlist> {
    const response = await http.get<Playlist>(`/playlists/${playlistId}`);
    return response.data;
  },

  // 플레이리스트 수정
  async updatePlaylist(playlistId: string, data: UpdatePlaylistRequest): Promise<void> {
    await http.patch(`/playlists/${playlistId}`, data);
  },

  // 플레이리스트 삭제
  async deletePlaylist(playlistId: string): Promise<DeletePlaylistResponse> {
    const response = await http.delete<DeletePlaylistResponse>(`/playlists/${playlistId}`);
    return response.data;
  },

  // 플레이리스트 트랙 목록 조회
  async getPlaylistTracks(
    playlistId: string,
    params?: {
      limit?: number;
      offset?: number;
      sortBy?: 'addedAt' | 'playCount';
      order?: 'asc' | 'desc';
    }
  ): Promise<PlaylistTracksResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.order) searchParams.append('order', params.order);

    const queryString = searchParams.toString();
    const url = `/playlists/${playlistId}/songs${queryString ? `?${queryString}` : ''}`;

    const response = await http.get<PlaylistTracksResponse>(url);
    return response.data;
  },

  // 플레이리스트에 트랙 추가
  async addTracksToPlaylist(
    playlistId: string,
    uris: string[]
  ): Promise<any> {
    const response = await http.post(
      `/playlists/${playlistId}/songs`,
      { uris }
    );
    return response.data;
  },

  // 플레이리스트에서 트랙 삭제
  async deleteTracksFromPlaylist(
    playlistId: string,
    songId: string,
    data: DeleteTracksRequest
  ): Promise<DeleteTracksResponse> {
    const response = await http.delete<DeleteTracksResponse>(
      `/playlists/${playlistId}/songs/${songId}`,
      { data }
    );
    return response.data;
  },

  // 특정 노래의 플레이리스트 멤버십 확인
  async getPlaylistMembership(songId: string): Promise<PlaylistMembershipResponse> {
    const response = await http.get<PlaylistMembershipResponse>(`/playlists/songs/${songId}/membership`);
    return response.data;
  },

  // 선택한 플레이리스트에 노래 추가
  async addSongToPlaylist(songId: string, playlistId: number): Promise<AddSongResponse> {
    const response = await http.post<AddSongResponse>(
      `/playlists/songs/${songId}/add`,
      null,
      { params: { playlistId } }
    );
    return response.data;
  },

  // 가장 오래된 플레이리스트에 노래 추가 (하트 버튼용)
  async addSongToOldestPlaylist(songId: string): Promise<AddSongResponse> {
    const response = await http.post<AddSongResponse>(`/playlists/songs/${songId}/add-to-oldest`);
    return response.data;
  },

  // 모든 플레이리스트에서 노래 삭제 (하트 버튼 해제용)
  async removeSongFromAllPlaylists(songId: string): Promise<AddSongResponse> {
    const response = await http.delete<AddSongResponse>(`/playlists/songs/${songId}/remove-from-all`);
    return response.data;
  }
};

// 편의를 위한 개별 함수들 export
export const getPlaylistsService = playlistService.getPlaylists;
export const getUserPlaylistsService = playlistService.getPlaylists; // 사용자 플레이리스트 목록 조회
export const getPlaylistMembershipService = playlistService.getPlaylistMembership;
export const addSongToPlaylistService = playlistService.addSongToPlaylist;
export const addSongToOldestPlaylistService = playlistService.addSongToOldestPlaylist;
export const removeSongFromAllPlaylistsService = playlistService.removeSongFromAllPlaylists;