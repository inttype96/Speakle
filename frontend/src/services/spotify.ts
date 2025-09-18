import { http } from "./http";

export type SpotifyConnectResponse = {
  redirectUrl: string;
};

export type SpotifyStatusResponse = {
  status: number;
  message: string;
  data: {
    connected: boolean;
    expiresAtEpochSec: number | null;
    scope: string | null;
  };
};

export type SpotifyProfileResponse = {
  status: number;
  message: string;
  data: {
    id: string;
    display_name: string;
    email: string;
    country: string;
  };
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

