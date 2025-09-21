import type { Difficulty } from "./recommend";

export type SearchRequest = {
  keyword?: string;
  level?: string;
  minPopularity?: number;
  maxPopularity?: number;
  page?: number;
  size?: number;
  sort?: string[];
};

export type SearchSong = {
  songId: string;
  title: string;
  artists: string;
  albumName: string;
  albumImgUrl: string;
  level: Difficulty;
  durationMs: number;
  popularity: number;
  learnCount: number;
};

export type SearchResult = {
  content: SearchSong[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  isFirst: boolean;
  isLast: boolean;
};

export type SearchResponse = {
  status: number;
  message: string;
  data: SearchResult;
};