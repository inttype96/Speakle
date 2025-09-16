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