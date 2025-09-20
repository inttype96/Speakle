"use client";

import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { Song, Difficulty } from "@/types/recommend";
import type { SearchSong } from "@/types/search";

// shadcn
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

// icons
import { Heart, Music2, Filter, Clock, Flame, ChevronRight } from "lucide-react";

// types
type UnifiedSong = Song | SearchSong;
type SortKey = "recommend" | "popularity" | "duration" | "learn";

type SongListViewProps = {
  songs: UnifiedSong[];
  loading?: boolean;
  error?: string | null;
  showFeaturedSection?: boolean;
  showRecommendationKeywords?: boolean;
  keywords?: { words: string[]; phrases: string[] };
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  difficulty?: "ALL" | Difficulty;
  onDifficultyChange?: (difficulty: "ALL" | Difficulty) => void;
  sortBy?: SortKey;
  onSortChange?: (sort: SortKey) => void;
  showMoreButton?: boolean;
  onShowMore?: () => void;
  situation?: string;
  location?: string;
};

// utils
const msToMinSec = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const buildSongDetailLink = (songId: string, situation?: string, location?: string): string => {
  const params = new URLSearchParams();
  if (situation) params.append("situation", situation);
  if (location) params.append("location", location);
  const queryString = params.toString();
  return `/songs/${songId}${queryString ? `?${queryString}` : ""}`;
};

const DIFFICULTY_MAP: Record<Difficulty, { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }> = {
  LOW: { label: "쉬움", variant: "secondary" },
  MEDIUM: { label: "보통", variant: "default" },
  HIGH: { label: "어려움", variant: "destructive" },
};

const sorters: Record<SortKey, (a: UnifiedSong, b: UnifiedSong) => number> = {
  recommend: (a, b) => {
    const aScore = 'recommendScore' in a ? a.recommendScore : 0;
    const bScore = 'recommendScore' in b ? b.recommendScore : 0;
    return bScore - aScore;
  },
  popularity: (a, b) => b.popularity - a.popularity,
  duration: (a, b) => a.durationMs - b.durationMs,
  learn: (a, b) => b.learnCount - a.learnCount,
};

export default function SongListView({
  songs,
  loading = false,
  error = null,
  showFeaturedSection = false,
  showRecommendationKeywords = false,
  keywords,
  title = "곡 목록",
  subtitle = "조건에 맞는 곡들을 찾았습니다.",
  emptyMessage = "결과가 없습니다.",
  emptyActionText,
  onEmptyAction,
  difficulty = "ALL",
  onDifficultyChange,
  sortBy = "popularity",
  onSortChange,
  showMoreButton = false,
  onShowMore,
  situation,
  location,
}: SongListViewProps) {
  const filteredSorted = useMemo(() => {
    const base = difficulty === "ALL" ? songs : songs.filter((s) => s.difficulty === difficulty);
    const copy = [...base];
    copy.sort(sorters[sortBy]);
    return copy;
  }, [songs, difficulty, sortBy]);

  const { top, rest, gridList } = useMemo(() => {
    if (!filteredSorted.length) return { top: null, rest: [], gridList: [] };

    return {
      top: showFeaturedSection ? filteredSorted[0] : null,
      rest: showFeaturedSection ? filteredSorted.slice(1, 5) : [],
      gridList: filteredSorted,
    };
  }, [filteredSorted, showFeaturedSection]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {/* 추천 키워드 (추천 페이지에서만) */}
      {showRecommendationKeywords && keywords && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">이런 표현을 배울 수 있어요</h3>
              <div className="flex flex-wrap gap-2">
                {[...keywords.words, ...keywords.phrases].map((keyword, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 상위 결과 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <FeaturedSkeleton showFeaturedSection={showFeaturedSection} />
          ) : error ? (
            <div className="p-6 text-sm text-destructive">{error}</div>
          ) : !top && showFeaturedSection ? (
            <div className="p-6 text-sm text-muted-foreground">
              {emptyMessage}
              {emptyActionText && onEmptyAction && (
                <Button variant="outline" className="ml-2" onClick={onEmptyAction}>
                  {emptyActionText}
                </Button>
              )}
            </div>
          ) : showFeaturedSection && top ? (
            <div className="grid grid-cols-1 lg:grid-cols-3">
              {/* 왼쪽 메인 카드 */}
              <div className="p-4">
                <FeaturedCard song={top} situation={situation} location={location} />
              </div>

              {/* 오른쪽 리스트 */}
              <div className="lg:col-span-2 p-4">
                <div className="px-1 pt-2 pb-3 text-sm font-medium">상위 결과</div>
                <ScrollArea className="max-h-[220px] pr-2">
                  <div className="space-y-2">
                    {rest.map((s) => (
                      <TopResultItem key={s.songId} song={s} situation={situation} location={location} />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* 필터 & 정렬 바 */}
      {(onDifficultyChange || onSortChange) && (
        <>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" /> 필터 및 정렬
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* 정렬 */}
              {onSortChange && (
                <Select value={sortBy} onValueChange={(v: SortKey) => onSortChange(v)}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="정렬" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommend">추천순</SelectItem>
                    <SelectItem value="popularity">인기순</SelectItem>
                    <SelectItem value="duration">재생시간</SelectItem>
                    <SelectItem value="learn">학습수</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* 난이도 필터 */}
              {onDifficultyChange && (
                <Select value={difficulty} onValueChange={(v: "ALL" | Difficulty) => onDifficultyChange(v)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="모든 난이도" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">모든 난이도</SelectItem>
                    <SelectItem value="LOW">쉬움</SelectItem>
                    <SelectItem value="MEDIUM">보통</SelectItem>
                    <SelectItem value="HIGH">어려움</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* 카드 그리드 */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gridList.map((s) => (
              <SongCard key={s.songId} song={s} situation={situation} location={location} />
            ))}
          </div>

          {/* 더 보기 */}
          {showMoreButton && onShowMore && (
            <div className="flex justify-center pt-6">
              <Button variant="outline" onClick={onShowMore}>
                더 보기
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FeaturedCard({ song, situation, location }: { song: UnifiedSong; situation?: string; location?: string }) {
  const diff = DIFFICULTY_MAP[song.difficulty];
  const to = buildSongDetailLink(song.songId, situation, location);

  console.log("FeaturedCard Debug:", {
    title: song.title,
    songId: song.songId,
    situation,
    location,
    linkTo: to
  });

  return (
    <Card className="overflow-hidden relative">
      <Link to={to} className="absolute inset-0 z-10" aria-label={`${song.title} 상세 보기`} />

      <div className="aspect-[16/10] bg-muted relative">
        {song.albumImgUrl ? (
          <img src={song.albumImgUrl} alt={song.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Music2 className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge variant={diff.variant || "default"}>{diff.label}</Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="truncate">{song.title}</CardTitle>
        <p className="text-sm text-muted-foreground truncate">곡 · {song.artists}</p>
      </CardHeader>
      <CardContent className="pt-0 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {msToMinSec(song.durationMs)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame className="h-4 w-4" />
            {song.popularity}
          </span>
        </div>
        <Button size="icon" variant="ghost" className="rounded-full z-20 relative" onClick={(e) => e.stopPropagation()}>
          <Heart className="h-5 w-5" />
        </Button>
      </CardContent>
    </Card>
  );
}

function TopResultItem({ song, situation, location }: { song: UnifiedSong; situation?: string; location?: string }) {
  const diff = DIFFICULTY_MAP[song.difficulty];
  const to = buildSongDetailLink(song.songId, situation, location);

  console.log("TopResultItem Debug:", {
    title: song.title,
    songId: song.songId,
    situation,
    location,
    linkTo: to
  });

  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent focus:bg-accent outline-none"
    >
      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
        {song.albumImgUrl ? (
          <img src={song.albumImgUrl} alt={song.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Music2 className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{song.title}</span>
          <Badge variant={diff.variant || "default"}>{diff.label}</Badge>
        </div>
        <div className="truncate text-sm text-muted-foreground">{song.artists}</div>
      </div>
      <div className="text-xs text-muted-foreground">{msToMinSec(song.durationMs)}</div>
    </Link>
  );
}

function SongCard({ song, situation, location }: { song: UnifiedSong; situation?: string; location?: string }) {
  const diff = DIFFICULTY_MAP[song.difficulty];
  const to = buildSongDetailLink(song.songId, situation, location);

  console.log("SongCard Debug:", {
    title: song.title,
    songId: song.songId,
    situation,
    location,
    linkTo: to
  });

  return (
    <Card className="overflow-hidden relative">
      <Link to={to} className="absolute inset-0 z-10" aria-label={`${song.title} 상세 보기`} />

      <div className="relative aspect-[4/3] bg-muted">
        {song.albumImgUrl ? (
          <img src={song.albumImgUrl} alt={song.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Music2 className="h-8 w-8" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge variant={diff.variant || "default"}>{diff.label}</Badge>
        </div>
        <Button size="icon" variant="secondary" className="absolute right-3 top-3 rounded-full h-8 w-8 z-20" onClick={(e) => e.stopPropagation()}>
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base leading-tight line-clamp-1">{song.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-1">{song.artists}</p>
      </CardHeader>
      <CardContent className="pt-0 flex items-center justify-between text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {msToMinSec(song.durationMs)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Flame className="h-4 w-4" />
          {song.popularity}
        </span>
      </CardContent>
    </Card>
  );
}

function FeaturedSkeleton({ showFeaturedSection }: { showFeaturedSection: boolean }) {
  if (!showFeaturedSection) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
      <div className="p-4">
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
      <div className="lg:col-span-2 p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3 mt-2" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}