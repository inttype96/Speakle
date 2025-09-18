import { http } from "./http";

// 포인트 프로필 조회
export interface PointProfile {
  userId: number;
  balance: number;
  level: string;
}

export interface PointProfileResponse {
  status: number;
  message: string;
  data: PointProfile;
}

export async function getPointProfileAPI(userId: number) {
  const res = await http.get<PointProfileResponse>(`/reward/profile?userId=${userId}`);
  return res;
}

// 포인트 랭킹 조회
export interface RankingUser {
  rank: number;
  userId: number;
  username: string;
  profileImageUrl: string;
  points: number;
}

export interface RankingResponse {
  status: number;
  message: string;
  data: RankingUser[];
}

export async function getPointRankingAPI() {
  const res = await http.get<RankingResponse>("/reward/ranking");
  return res;
}

// 회원 정보 수정
export interface UpdateUserRequest {
  username: string;
  gender: string;
  birth: string;
  profileImageUrl: string;
}

export interface UpdateUserResponse {
  status: number;
  message: string;
  data: {
    userId: number;
    email: string;
    username: string;
    gender: string;
    birth: string;
    profileImageUrl: string;
  };
}

export async function updateUserAPI(payload: UpdateUserRequest) {
  const res = await http.patch<UpdateUserResponse>("/user", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res;
}

// 회원 탈퇴
export interface DeleteUserResponse {
  status: number;
  message: string;
}

export async function deleteUserAPI() {
  const res = await http.delete<DeleteUserResponse>("/user");
  return res;
}

// 플레이리스트 조회
export interface Playlist {
  playlistId: number;
  userId: number;
  title: string;
  description: string;
  coverImageUrl: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistResponse {
  status: number;
  message: string;
  data: Playlist[];
}

export async function getUserPlaylistsAPI() {
  const res = await http.get<PlaylistResponse>("/user/playlists", {
    headers: { "Content-Type": "application/json" },
  });
  return res;
}

// 출석 체크
export interface CheckinRequest {
  userId: number;
  localDate: string;
}

export interface CheckinResponse {
  status: number;
  message: string;
  data: {
    userId: number;
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
    totalPoints: number;
    lastCheckinDate: string;
  };
}

export async function checkinAPI(payload: CheckinRequest) {
  const res = await http.post<CheckinResponse>("/reward/checkin", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res;
}

// 출석 정보 조회 (GET 요청으로 체크인 정보 가져오기)
export async function getCheckinInfoAPI(userId: number, localDate: string) {
  const res = await http.get<CheckinResponse>(`/reward/checkin?userId=${userId}&localDate=${localDate}`);
  return res;
}

// 최근 학습한 곡 조회
export interface LearnedSong {
  learnedSongId: number;
  userId: number;
  songId: number;
  artists: string;
  title: string;
  album: string;
  albumImgUrl: string;
  level: string;
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  durationMs: number;
  lyrics: string;
  createdAt: string;
}

export interface Pagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface RecentSongsResponse {
  status: number;
  message: string;
  data: {
    learnedSongs: LearnedSong[];
    pagination: Pagination;
  };
}

export async function getRecentLearnedSongsAPI(page: number = 1, size: number = 5) {
  const res = await http.get<RecentSongsResponse>(`/user/recent?page=${page}&size=${size}`, {
    headers: { "Content-Type": "application/json" },
  });
  return res;
}

// 학습한 곡 상세 조회
export interface LearnedSongDetail {
  songInfo: LearnedSong;
  learnedContent: {
    sentences: Array<{
      sentencesId: number;
      sentence: string;
      meaning: string;
      tags: string;
      level: string;
      createdAt: string;
    }>;
    words: Array<{
      wordId: number;
      word: string;
      phonetic: string;
      meaning: string;
      pos: string;
      examples: string;
      level: string;
      tags: string;
      createdAt: string;
    }>;
    expressions: Array<{
      expressionId: number;
      expression: string;
      meaning: string;
      context: string;
      examples: string;
      tags: string;
      level: string;
      createdAt: string;
    }>;
    idioms: Array<{
      idiomId: number;
      phrase: string;
      meaning: string;
      examples: string;
      tags: string;
      level: string;
      createdAt: string;
    }>;
  };
}

export interface LearnedSongDetailResponse {
  status: number;
  message: string;
  data: LearnedSongDetail;
}

export async function getLearnedSongDetailAPI(learnedSongId: number) {
  const res = await http.get<LearnedSongDetailResponse>(`/user/learned-songs/${learnedSongId}`, {
    headers: { "Content-Type": "application/json" },
  });
  return res;
}