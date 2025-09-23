import { http } from "./http";

export type SpotifyConnectResponse = {
  redirectUrl: string;
};

export type SpotifyStatusResponse = {
  connected: boolean;
  expiresAtEpochSec: number | null;
  scope: string | null;
};

export type SpotifyProfileResponse = {
  id: string;
  displayName: string;
  email: string;
  country: string;
};

export async function connectSpotifyAPI() {
  const res = await http.get<SpotifyConnectResponse>("/spotify/connect");
  return res;
}

export async function getSpotifyStatusAPI() {
  const res = await http.get<SpotifyStatusResponse>("/spotify/status");
  return res;
}

export async function getSpotifyProfileAPI() {
  const res = await http.get<SpotifyProfileResponse>("/spotify/profile");
  return res;
}

export async function disconnectSpotifyAPI() {
  const res = await http.delete("/spotify/disconnect");
  return res;
}

export async function getSpotifyPlaylistsAPI() {
  const res = await http.get("/spotify/playlists");
  return res;
}

export async function getCurrentPlaybackAPI() {
  const res = await http.get("/spotify/player");
  return res;
}

export async function pausePlaybackAPI() {
  const res = await http.post("/spotify/player/pause");
  return res;
}

export async function resumePlaybackAPI() {
  const res = await http.post("/spotify/player/play");
  return res;
}

export async function skipToNextAPI() {
  const res = await http.post("/spotify/player/next");
  return res;
}

export async function skipToPreviousAPI() {
  const res = await http.post("/spotify/player/previous");
  return res;
}

export async function playTrackAPI(trackId: string) {
  const res = await http.post("/spotify/player/play", {
    trackId: trackId
  });
  return res;
}

export async function setVolumeAPI(volumePercent: number) {
  const res = await http.post("/spotify/player/volume", {
    volume: volumePercent
  });
  return res;
}

export type SpotifyPlaybackState = {
  isPlaying: boolean;
  trackId: string | null;
  trackName: string | null;
  artistName: string | null;
  volumePercent: number;
  progressMs: number;
  durationMs: number;
}

export async function getSpotifyTokenAPI() {
  const res = await http.get<{ accessToken: string }>("/spotify/token");
  return res;
}

