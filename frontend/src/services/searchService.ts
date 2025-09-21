import { http } from "./http";
import type { SearchRequest, SearchResponse, SearchResult } from "@/types/search";

export async function searchSongs(params: SearchRequest): Promise<SearchResult> {
  const response = await http.post<SearchResponse>("/songs/search", {
    keyword: params.keyword || "",
    level: params.level,
    minPopularity: params.minPopularity,
    maxPopularity: params.maxPopularity,
    page: params.page || 0,
    size: params.size || 20,
    sort: params.sort || ["popularity,desc"]
  });

  return response.data.data;
}