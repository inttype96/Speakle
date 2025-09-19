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
  public: boolean;
  collaborative: boolean;
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
  public?: boolean;
  collaborative?: boolean;
}

// 플레이리스트 수정 요청 타입
export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
  public?: boolean;
  collaborative?: boolean;
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

// API 함수들
export const playlistService = {
  // 플레이리스트 목록 조회
  async getPlaylists(): Promise<Playlist[]> {
    const response = await http.get<Playlist[]>('/api/playlists');
    return response.data;
  },

  // 플레이리스트 생성
  async createPlaylist(data: CreatePlaylistRequest): Promise<Playlist> {
    const response = await http.post<Playlist>('/api/playlists/create', data);
    return response.data;
  },

  // 플레이리스트 상세 조회
  async getPlaylist(playlistId: string): Promise<Playlist> {
    const response = await http.get<Playlist>(`/api/playlists/${playlistId}`);
    return response.data;
  },

  // 플레이리스트 수정
  async updatePlaylist(playlistId: string, data: UpdatePlaylistRequest): Promise<void> {
    await http.patch(`/api/playlists/${playlistId}`, data);
  },

  // 플레이리스트 삭제
  async deletePlaylist(playlistId: string): Promise<DeletePlaylistResponse> {
    const response = await http.delete<DeletePlaylistResponse>(`/api/playlists/${playlistId}`);
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
    const url = `/api/playlists/${playlistId}/songs${queryString ? `?${queryString}` : ''}`;

    const response = await http.get<PlaylistTracksResponse>(url);
    return response.data;
  },

  // 플레이리스트에서 트랙 삭제
  async deleteTracksFromPlaylist(
    playlistId: string,
    songId: string,
    data: DeleteTracksRequest
  ): Promise<DeleteTracksResponse> {
    const response = await http.delete<DeleteTracksResponse>(
      `/api/playlists/${playlistId}/songs/${songId}`,
      { data }
    );
    return response.data;
  }
};