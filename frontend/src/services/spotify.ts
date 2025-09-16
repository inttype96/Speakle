import { http } from "./http";

export type SpotifyConnectResponse = {
  status: number;
  message: string;
  data: {
    redirectUrl: string;
  };
};

export async function connectSpotifyAPI() {
  const res = await http.get<SpotifyConnectResponse>("/spotify/connect");
  return res;
}

export async function getSpotifyStatusAPI() {
  const res = await http.get("/spotify/status");
  return res;
}

export async function disconnectSpotifyAPI() {
  const res = await http.delete("/spotify/disconnect");
  return res;
}

// 사용자 프로필 조회
export async function getSpotifyProfileAPI() {
  const res = await http.get("/spotify/profile");
  return res;
}

// 현재 재생 정보 조회
export async function getCurrentPlaybackAPI() {
  const res = await http.get("/spotify/player");
  return res;
}

// 플레이리스트 조회
export async function getPlaylistsAPI() {
  const res = await http.get("/spotify/playlists");
  return res;
}

// 재생 제어
export async function playAPI() {
  const res = await http.post("/spotify/player/play");
  return res;
}

export async function pauseAPI() {
  const res = await http.post("/spotify/player/pause");
  return res;
}

export async function nextTrackAPI() {
  const res = await http.post("/spotify/player/next");
  return res;
}

export async function previousTrackAPI() {
  const res = await http.post("/spotify/player/previous");
  return res;
}