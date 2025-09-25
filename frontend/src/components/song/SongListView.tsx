import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Song, Difficulty } from "@/types/recommend";
import type { SearchSong } from "@/types/search";
import { usePlaylistSave } from "@/hooks/usePlaylistSave";

// shadcn
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

// icons
import { Heart, Filter, Clock, Flame, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

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
  searchQuery?: string;
  // 페이지네이션 관련
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

// utils
const msToMinSec = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const buildSongDetailLink = (songId: string, situation?: string, location?: string, searchQuery?: string): string => {
  const params = new URLSearchParams();
  if (situation) params.append("situation", situation);
  if (location) params.append("location", location);
  if (searchQuery) params.append("q", searchQuery);
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
  sortBy = "popularity", // 검색에서는 기본적으로 인기순
  onSortChange,
  showMoreButton = false,
  onShowMore,
  situation,
  location,
  searchQuery,
  currentPage = 0,
  totalPages = 0,
  onPageChange,
}: SongListViewProps) {
  const [showKeywords, setShowKeywords] = useState(false);
  const [keywordPage, setKeywordPage] = useState(0);

  const filteredSorted = useMemo(() => {
    const base = difficulty === "ALL" ? songs : songs.filter((s) => s.level === difficulty);
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
    <div className="space-y-6 pt-8">
      {/* 헤더 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {/* 추천 키워드 (추천 페이지에서만) */}
      {showRecommendationKeywords && keywords && (
        <Card className="bg-gradient-to-r from-[#4B2199]/10 to-[#7070BA]/10 border-[#4B2199]/20">
          <CardContent className="pt-5 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">이런 표현을 배울 수 있어요</h3>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowKeywords(!showKeywords)}
                  className="bg-[#4B2199] hover:bg-[#B5A6E0] hover:text-black text-white"
                >
                  {showKeywords ? (
                    <>
                      접기 <ChevronUp className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      보러 가기 <ChevronDown className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              {showKeywords && (() => {
                const allKeywords = [...keywords.words, ...keywords.phrases];
                const totalPages = Math.ceil(allKeywords.length / 10);
                const currentKeywords = allKeywords.slice(keywordPage * 10, (keywordPage + 1) * 10);

                return (
                  <div className="pt-2">
                    <div className="flex flex-wrap gap-2">
                      {currentKeywords.map((keyword, idx) => (
                        <Badge
                          key={idx}
                          className="bg-[#B5A6E0] text-black hover:bg-[#4B2199] hover:text-white text-sm px-3 py-1"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setKeywordPage(Math.max(0, keywordPage - 1))}
                          disabled={keywordPage === 0}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {keywordPage + 1} / {totalPages}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setKeywordPage(Math.min(totalPages - 1, keywordPage + 1))}
                          disabled={keywordPage === totalPages - 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
              {/* 왼쪽 메인 카드 - 크기 축소 */}
              <div className="p-3">
                <FeaturedCard song={top} situation={situation} location={location} searchQuery={searchQuery} />
              </div>

              {/* 오른쪽 리스트 */}
              <div className="lg:col-span-3 p-3">
                <div className="px-1 pt-1 pb-2 text-sm font-medium">상위 결과</div>
                <ScrollArea className="max-h-[180px] pr-2">
                  <div className="space-y-2">
                    {rest.map((s) => (
                      <TopResultItem key={s.songId} song={s} situation={situation} location={location} searchQuery={searchQuery} />
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
                    {!searchQuery && <SelectItem value="recommend">추천순</SelectItem>}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gridList.map((s) => (
              <SongCard key={s.songId} song={s} situation={situation} location={location} searchQuery={searchQuery} />
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && onPageChange && (
            <div className="flex justify-center pt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}

          {/* 더 보기 (페이지네이션이 없을 때만) */}
          {showMoreButton && onShowMore && !onPageChange && (
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

function FeaturedCard({ song, situation, location, searchQuery }: { song: UnifiedSong; situation?: string; location?: string; searchQuery?: string }) {
  const diff = DIFFICULTY_MAP[song.level] || { label: "보통", variant: "default" as const };
  const to = buildSongDetailLink(song.songId, situation, location, searchQuery);
  const { isSaved, isLoading, saveToPlaylist } = usePlaylistSave();

  // 앨범 이미지 유효성 검사
  const hasValidImage = song.albumImgUrl &&
    song.albumImgUrl !== "no" &&
    song.albumImgUrl !== "null" &&
    song.albumImgUrl !== "none" &&
    song.albumImgUrl.trim() !== "";

  const handleSaveToPlaylist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await saveToPlaylist(song.songId);
  };

  return (
    <Card className="overflow-hidden relative">
      <Link to={to} className="absolute inset-0 z-10" aria-label={`${song.title} 상세 보기`} />

      <div className="aspect-square bg-muted relative">
        <img
          src={hasValidImage ? song.albumImgUrl : "/albumBasicCover.png"}
          alt={song.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-2 top-2">
          <Badge variant={diff.variant || "default" } className="text-xs">{diff.label}</Badge>
        </div>
      </div>
      <CardHeader className="pb-1 p-3">
        <CardTitle className="text-sm truncate">{song.title}</CardTitle>
        <p className="text-xs text-muted-foreground truncate">{song.artists.replace(/[\[\]']/g, '')}</p>
      </CardHeader>
      <CardContent className="pt-0 p-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {msToMinSec(song.durationMs)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame className="h-3 w-3" />
            {song.popularity}
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full z-20 relative h-7 w-7"
          onClick={handleSaveToPlaylist}
          disabled={isLoading}
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </CardContent>
    </Card>
  );
}

function TopResultItem({ song, situation, location, searchQuery }: { song: UnifiedSong; situation?: string; location?: string; searchQuery?: string }) {
  const diff = DIFFICULTY_MAP[song.level] || { label: "보통", variant: "default" as const };
  const to = buildSongDetailLink(song.songId, situation, location, searchQuery);

  // 앨범 이미지 유효성 검사
  const hasValidImage = song.albumImgUrl &&
    song.albumImgUrl !== "no" &&
    song.albumImgUrl !== "null" &&
    song.albumImgUrl !== "none" &&
    song.albumImgUrl.trim() !== "";

  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent focus:bg-accent outline-none"
    >
      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
        <img
          src={hasValidImage ? song.albumImgUrl : "/albumBasicCover.png"}
          alt={song.title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{song.title}</span>
          <Badge variant={diff.variant || "default"}>{diff.label}</Badge>
        </div>
        <div className="truncate text-sm text-muted-foreground">{song.artists.replace(/[\[\]']/g, '')}</div>
      </div>
      <div className="text-xs text-muted-foreground">{msToMinSec(song.durationMs)}</div>
    </Link>
  );
}

function SongCard({ song, situation, location, searchQuery }: { song: UnifiedSong; situation?: string; location?: string; searchQuery?: string }) {
  const diff = DIFFICULTY_MAP[song.level] || { label: "보통", variant: "default" as const };
  const to = buildSongDetailLink(song.songId, situation, location, searchQuery);
  const { isSaved, isLoading, saveToPlaylist } = usePlaylistSave();

  // 앨범 이미지 유효성 검사
  const hasValidImage = song.albumImgUrl &&
    song.albumImgUrl !== "no" &&
    song.albumImgUrl !== "null" &&
    song.albumImgUrl !== "none" &&
    song.albumImgUrl.trim() !== "";

  const handleSaveToPlaylist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await saveToPlaylist(song.songId);
  };

  return (
    <Card className="overflow-hidden relative">
      <Link to={to} className="absolute inset-0 z-10" aria-label={`${song.title} 상세 보기`} />

      <div className="relative aspect-square bg-muted">
        <img
          src={hasValidImage ? song.albumImgUrl : "/albumBasicCover.png"}
          alt={song.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute left-3 top-3">
          <Badge variant={diff.variant || "default"}>{diff.label}</Badge>
        </div>
        <Button
          size="icon"
          variant="secondary"
          className="absolute right-3 top-3 rounded-full h-8 w-8 z-20"
          onClick={handleSaveToPlaylist}
          disabled={isLoading}
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base leading-tight line-clamp-1">{song.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-1">{song.artists.replace(/[\[\]']/g, '')}</p>
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

function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      // 총 페이지가 7개 이하면 모두 표시
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 총 페이지가 많으면 현재 페이지 주변만 표시
      if (currentPage <= 3) {
        // 처음 부분
        for (let i = 0; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages - 1);
      } else if (currentPage >= totalPages - 4) {
        // 끝 부분
        pages.push(0);
        pages.push("...");
        for (let i = totalPages - 5; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 중간 부분
        pages.push(0);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="flex items-center justify-center gap-2">
      {/* 이전 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        이전
      </Button>

      {/* 페이지 번호들 */}
      {pageNumbers.map((page, index) => (
        <div key={index}>
          {page === "..." ? (
            <span className="px-3 py-2 text-sm text-muted-foreground">...</span>
          ) : (
            <Button
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className="min-w-[40px]"
            >
              {(page as number) + 1}
            </Button>
          )}
        </div>
      ))}

      {/* 다음 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
      >
        다음
      </Button>
    </div>
  );
}