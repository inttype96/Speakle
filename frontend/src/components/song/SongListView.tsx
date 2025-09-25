import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Song, Difficulty } from "@/types/recommend";
import type { SearchSong } from "@/types/search";
import { usePlaylistSave } from "@/hooks/usePlaylistSave";
import PlaylistDropdown from "@/components/playlists/PlaylistDropdown";

// shadcn
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

// icons
import { Filter, Clock, Flame, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import likeIconDark from "@/assets/images/likeIcon_dark.png";
import likeIconDarkActive from "@/assets/images/likeIcon_dark_active.png";

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

const DIFFICULTY_MAP: Record<Difficulty, { label: string; className: string }> = {
  LOW: { label: "쉬움", className: "bg-green-600/80 text-white border-green-500/50 hover:bg-green-500/90" },
  MEDIUM: { label: "보통", className: "bg-yellow-600/80 text-white border-yellow-500/50 hover:bg-yellow-500/90" },
  HIGH: { label: "어려움", className: "bg-red-600/80 text-white border-red-500/50 hover:bg-red-500/90" },
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
    <div className="space-y-8 pt-2 font-sans">
      {/* Google Fonts Link */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      {/* 헤더 */}
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight font-['Pretendard'] text-white">{title}</h1>
        <p className="text-base text-gray-300 font-['Pretendard'] font-medium max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
      </div>

      {/* 추천 키워드 (추천 페이지에서만) */}
      {showRecommendationKeywords && keywords && (
        <div className="max-w-5xl mx-auto">
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardContent className="pt-5 pb-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white font-['Pretendard']">이런 표현을 배울 수 있어요</h3>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowKeywords(!showKeywords)}
                    className="bg-[#4B2199] hover:bg-[#B5A6E0] hover:text-black text-white font-['Pretendard'] font-semibold rounded-xl px-3 py-1.5 text-sm transition-all duration-300"
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
                  <div className="pt-3">
                    <div className="flex flex-wrap gap-2">
                      {currentKeywords.map((keyword, idx) => (
                        <Badge
                          key={idx}
                          className="bg-white/20 text-white border-white/30 hover:bg-[#B5A6E0] hover:text-black transition-all duration-300 text-xs px-3 py-1.5 font-['Pretendard'] font-medium rounded-lg"
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
                        <span className="text-sm text-white/70 font-['Pretendard'] font-medium">
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
        </div>
      )}

      {/* 상위 결과 */}
      <div className="max-w-7xl mx-auto">
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl">
          <CardContent className="p-0">
          {loading ? (
            <FeaturedSkeleton showFeaturedSection={showFeaturedSection} />
          ) : error ? (
            <div className="p-8 text-center text-red-400 font-['Pretendard'] font-medium">{error}</div>
          ) : !top && showFeaturedSection ? (
            <div className="p-8 text-center text-gray-300 font-['Pretendard'] font-medium">
              {emptyMessage}
              {emptyActionText && onEmptyAction && (
                <Button variant="outline" className="ml-3 border-white/20 text-white hover:bg-white/10" onClick={onEmptyAction}>
                  {emptyActionText}
                </Button>
              )}
            </div>
          ) : showFeaturedSection && top ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
              {/* 왼쪽 메인 카드 */}
              <div className="p-5">
                <FeaturedCard song={top} situation={situation} location={location} searchQuery={searchQuery} />
              </div>

              {/* 오른쪽 리스트 */}
              <div className="lg:col-span-3 p-5">
                <div className="px-2 pt-1 pb-3 text-base font-bold text-white font-['Pretendard']">상위 결과</div>
                <ScrollArea className="max-h-[160px] pr-3">
                  <div className="space-y-2.5">
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
      </div>

      {/* 필터 & 정렬 바 */}
      {(onDifficultyChange || onSortChange) && (
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-black/10 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="inline-flex items-center gap-2 text-sm text-white font-['Pretendard'] font-semibold">
              <Filter className="h-4 w-4" /> 필터 및 정렬
            </div>
            <div className="flex items-center gap-3">
              {/* 정렬 */}
              {onSortChange && (
                <Select value={sortBy} onValueChange={(v: SortKey) => onSortChange(v)}>
                  <SelectTrigger className="w-28 h-9 bg-black/20 backdrop-blur-sm border-white/20 text-white font-['Pretendard'] font-medium rounded-lg text-sm">
                    <SelectValue placeholder="정렬" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 backdrop-blur-xl border-white/20 font-['Pretendard']">
                    {!searchQuery && <SelectItem value="recommend" className="text-white hover:bg-white/10">추천순</SelectItem>}
                    <SelectItem value="popularity" className="text-white hover:bg-white/10">인기순</SelectItem>
                    <SelectItem value="duration" className="text-white hover:bg-white/10">재생시간</SelectItem>
                    <SelectItem value="learn" className="text-white hover:bg-white/10">학습수</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* 난이도 필터 */}
              {onDifficultyChange && (
                <Select value={difficulty} onValueChange={(v: "ALL" | Difficulty) => onDifficultyChange(v)}>
                  <SelectTrigger className="w-32 h-9 bg-black/20 backdrop-blur-sm border-white/20 text-white font-['Pretendard'] font-medium rounded-lg text-sm">
                    <SelectValue placeholder="모든 난이도" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 backdrop-blur-xl border-white/20 font-['Pretendard']">
                    <SelectItem value="ALL" className="text-white hover:bg-white/10">모든 난이도</SelectItem>
                    <SelectItem value="LOW" className="text-white hover:bg-white/10">쉬움</SelectItem>
                    <SelectItem value="MEDIUM" className="text-white hover:bg-white/10">보통</SelectItem>
                    <SelectItem value="HIGH" className="text-white hover:bg-white/10">어려움</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 카드 그리드 */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden bg-black/20 backdrop-blur-sm border border-white/10">
                <Skeleton className="aspect-square w-full bg-white/10" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-white/10" />
                  <Skeleton className="h-3 w-1/2 bg-white/10" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
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
                <Button
                  variant="outline"
                  onClick={onShowMore}
                  className="border-white/20 text-white hover:bg-white/10 font-['Pretendard'] font-semibold px-6 py-2.5 rounded-lg text-sm"
                >
                  더 보기
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FeaturedCard({ song, situation, location, searchQuery }: { song: UnifiedSong; situation?: string; location?: string; searchQuery?: string }) {
  const diff = DIFFICULTY_MAP[song.level] || { label: "보통", className: "bg-yellow-600/80 text-white border-yellow-500/50 hover:bg-yellow-500/90" };
  const to = buildSongDetailLink(song.songId, situation, location, searchQuery);
  const { isSaved, isLoading, saveToPlaylist } = usePlaylistSave(song.songId);

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
    <Card className="overflow-hidden relative group bg-black/20 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
      <Link to={to} className="absolute inset-0 z-10" aria-label={`${song.title} 상세 보기`} />

      <div className="aspect-square bg-black/30 relative overflow-hidden">
        <img
          src={hasValidImage ? song.albumImgUrl : "/albumBasicCover.png"}
          alt={song.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute left-2 top-2">
          <Badge className={`text-xs backdrop-blur-sm border font-['Pretendard'] font-medium px-2 py-0.5 transition-colors duration-200 ${diff.className}`}>{diff.label}</Badge>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <CardHeader className="pb-1.5 p-3">
        <CardTitle className="text-sm truncate text-white font-['Pretendard'] font-semibold group-hover:text-purple-200 transition-colors duration-300">{song.title}</CardTitle>
        <p className="text-xs text-gray-300 truncate font-['Pretendard'] font-medium">{song.artists.replace(/[\[\]']/g, '')}</p>
      </CardHeader>
      <CardContent className="pt-0 p-3 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2 font-['Pretendard'] font-medium">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {msToMinSec(song.durationMs)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame className="h-3 w-3" />
            {song.popularity}
          </span>
        </div>
        <div className="flex items-center gap-1.5 z-20 relative opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-7 w-7 hover:bg-white/10 transition-colors duration-200"
            onClick={handleSaveToPlaylist}
            disabled={isLoading}
          >
              <img
                  src={isSaved ? likeIconDarkActive : likeIconDark}
                  alt={isSaved ? "저장됨" : "저장하기"}
                  className={`h-7 w-7 transition-all duration-200 ${
                    isSaved
                      ? 'scale-110 drop-shadow-sm'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
              />
            {/*<Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />*/}
          </Button>
          <PlaylistDropdown
            songId={song.songId}
            songTitle={song.title}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function TopResultItem({ song, situation, location, searchQuery }: { song: UnifiedSong; situation?: string; location?: string; searchQuery?: string }) {
  const diff = DIFFICULTY_MAP[song.level] || { label: "보통", className: "bg-yellow-600/80 text-white border-yellow-500/50 hover:bg-yellow-500/90" };
  const to = buildSongDetailLink(song.songId, situation, location, searchQuery);
  const { isSaved, isLoading, saveToPlaylist } = usePlaylistSave(song.songId);

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
    <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent focus-within:bg-accent group relative">
      <Link to={to} className="absolute inset-0 z-10" aria-label={`${song.title} 상세 보기`} />

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
          <Badge className={`text-xs backdrop-blur-sm border font-['Pretendard'] font-medium px-2 py-0.5 transition-colors duration-200 ${diff.className}`}>{diff.label}</Badge>
        </div>
        <div className="truncate text-sm text-muted-foreground">{song.artists.replace(/[\[\]']/g, '')}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs text-muted-foreground flex items-center h-6">{msToMinSec(song.durationMs)}</div>
        <div className="flex gap-1 z-20 relative items-center">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleSaveToPlaylist}
            disabled={isLoading}
          >
            <img
              src={isSaved ? likeIconDarkActive : likeIconDark}
              alt={isSaved ? "저장됨" : "저장하기"}
              className={`h-4 w-4 transition-all duration-200 ${
                isSaved
                  ? 'scale-110 drop-shadow-sm opacity-100'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
              }`}
            />
          </Button>
          <PlaylistDropdown
            songId={song.songId}
            songTitle={song.title}
          />
        </div>
      </div>
    </div>
  );
}

function SongCard({ song, situation, location, searchQuery }: { song: UnifiedSong; situation?: string; location?: string; searchQuery?: string }) {
  const diff = DIFFICULTY_MAP[song.level] || { label: "보통", className: "bg-yellow-600/80 text-white border-yellow-500/50 hover:bg-yellow-500/90" };
  const to = buildSongDetailLink(song.songId, situation, location, searchQuery);
  const { isSaved, isLoading, saveToPlaylist } = usePlaylistSave(song.songId);

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
          <Badge className={`text-xs backdrop-blur-sm border font-['Pretendard'] font-medium px-2 py-0.5 transition-colors duration-200 ${diff.className}`}>{diff.label}</Badge>
        </div>
        <div className="absolute right-3 top-3 flex gap-1 z-20">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full h-8 w-8"
            onClick={handleSaveToPlaylist}
            disabled={isLoading}
          >
              <img
                  src={isSaved ? likeIconDarkActive : likeIconDark}
                  alt={isSaved ? "저장됨" : "저장하기"}
                  className={`h-7 w-7 transition-all duration-200 ${
                    isSaved
                      ? 'scale-110 drop-shadow-sm'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
              />
            {/*<Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />*/}
          </Button>
          <PlaylistDropdown
            songId={song.songId}
            songTitle={song.title}
          />
        </div>
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
