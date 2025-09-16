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

