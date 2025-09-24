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
  const res = await http.get<RankingResponse>("/reward/ranking", {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  });
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

// 출석 정보 조회
export interface Attendance {
  checkedToday: boolean;
  lastCheckDate: string;
  currentStreak: number;
  totalAttendanceDays: number;
  pointsEarnedToday: number;
}

export interface AttendanceResponse {
  status: number;
  message: string;
  data: Attendance;
}

// 출석 통계 조회
export interface AttendanceStatsResponse {
  status: number;
  message: string;
  data: {
    totalAttendanceDays: number;
    currentStreak: number;
    maxStreak: number;
    thisMonthAttendance: number;
    firstAttendanceDate: string;
    lastAttendanceDate: string;
  };
}

// 출석 정보 조회 (자동 출석체크는 JWT 인증 시 자동으로 처리됨)
export async function getAttendanceAPI() {
  const res = await http.get<AttendanceResponse>("/attendance");
  return res;
}

// 출석 통계 조회
export async function getAttendanceStatsAPI() {
  const res = await http.get<AttendanceStatsResponse>("/attendance/stats");
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

