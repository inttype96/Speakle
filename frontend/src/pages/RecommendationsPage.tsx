"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchRecommendations } from "@/services/recommend";
import { searchSongs } from "@/services/searchService";
import type { Song, Difficulty, RecommendData } from "@/types/recommend";
import type { SearchSong, SearchResult } from "@/types/search";
import Navbar from "@/components/common/navbar";
import SongListView from "@/components/song/SongListView";
import { recommendCache, searchCache } from "@/utils/cacheManager";

// shadcn
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// icons
import { ChevronRight } from "lucide-react";

type SortKey = "recommend" | "popularity" | "duration" | "learn";
type UnifiedSong = Song | SearchSong;

export default function RecommendationsPage() {
  const [sp] = useSearchParams();
  const situation = sp.get("situation") ?? "";
  const location = sp.get("location") ?? "";
  const genre = sp.get("genre") ?? "";
  const searchQuery = sp.get("q") ?? "";

  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [songs, setSongs] = useState<UnifiedSong[]>([]);
  const [keywords, setKeywords] = useState<{ words: string[]; phrases: string[] } | undefined>();
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLast, setIsLast] = useState(false);

  const [difficulty, setDifficulty] = useState<"ALL" | Difficulty>("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("recommend");

  const isSearchMode = Boolean(searchQuery);
  const isRecommendMode = Boolean(situation && location);

  const fetchData = useCallback(async (append = false) => {
    if (!isSearchMode && !isRecommendMode) return;

    try {
      if (isSearchMode) {
        // 검색 모드
        const page = append ? currentPage + 1 : 0;
        const sortKey = `${sortBy === 'recommend' ? 'popularity' : sortBy},desc`;

        // 캐시 확인
        const cached = searchCache.get(searchQuery, page, sortKey) as SearchResult;

        if (cached && !append) {
          console.log('[Cache Hit] 검색 결과 캐시 사용:', searchQuery);
          setSongs(cached.content);
          setTotalCount(cached.totalElements);
          setCurrentPage(cached.currentPage);
          setIsLast(cached.isLast);
          setKeywords(undefined);
          return;
        }

        setLoading(true);
        setError(null);

        const result = await searchSongs({
          keyword: searchQuery,
          page,
          size: 20,
          sort: [sortKey]
        });

        // 캐시에 저장
        searchCache.set(searchQuery, page, sortKey, result);

        if (append) {
          setSongs(prev => [...prev, ...result.content]);
        } else {
          setSongs(result.content);
        }

        setTotalCount(result.totalElements);
        setCurrentPage(result.currentPage);
        setIsLast(result.isLast);
        setKeywords(undefined);
      } else {
        // 추천 모드
        // 캐시 확인
        const cached = recommendCache.get(situation, location) as RecommendData;

        if (cached && !append) {
          console.log('[Cache Hit] 추천 결과 캐시 사용:', { situation, location });
          setSongs(cached.recommendedSongs ?? []);
          setKeywords(cached.keywords);
          setTotalCount(cached.totalCount ?? 0);
          setIsLast((cached.recommendedSongs?.length ?? 0) >= (cached.totalCount ?? 0));
          return;
        }

        setLoading(true);
        setError(null);

        const data = await fetchRecommendations({
          situation,
          location,
          limit: append ? limit + 12 : limit,
        });

        // 캐시에 저장 (append가 아닐 때만)
        if (!append) {
          recommendCache.set(situation, location, data);
        }

        setSongs(data.recommendedSongs ?? []);
        setKeywords(data.keywords);
        setTotalCount(data.totalCount ?? 0);
        setIsLast((data.recommendedSongs?.length ?? 0) >= (data.totalCount ?? 0));
      }
    } catch (e: any) {
      setError(e?.message ?? (isSearchMode ? "검색 중 오류가 발생했습니다." : "추천 결과를 불러오지 못했습니다."));
      if (!append) {
        setSongs([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [situation, location, searchQuery, limit, sortBy, isSearchMode, isRecommendMode, currentPage]);

  useEffect(() => {
    if (isSearchMode || isRecommendMode) {
      console.log('[RecommendationsPage] useEffect triggered:', { situation, location, searchQuery, sortBy });
      setCurrentPage(0);

      // 정렬이 바뀌면 캐시를 무시하고 다시 가져오기
      if (isSearchMode) {
        const page = 0;
        const sortKey = `${sortBy === 'recommend' ? 'popularity' : sortBy},desc`;
        const cached = searchCache.get(searchQuery, page, sortKey) as SearchResult | null;
        console.log('[Search Cache Check]', { searchQuery, cached: !!cached });
        if (!cached) {
          fetchData();
        } else {
          // 캐시가 있으면 바로 사용
          console.log('[Search Cache Hit] Using cached search results');
          setSongs(cached.content);
          setTotalCount(cached.totalElements);
          setCurrentPage(cached.currentPage);
          setIsLast(cached.isLast);
          setKeywords(undefined);
          setLoading(false);
        }
      } else {
        const cached = recommendCache.get(situation, location) as RecommendData | null;
        console.log('[Recommend Cache Check]', { situation, location, cached: !!cached });
        if (!cached) {
          console.log('[Cache Miss] Fetching from API');
          fetchData();
        } else {
          // 캐시가 있으면 바로 사용
          console.log('[Recommend Cache Hit] Using cached recommendations');
          setSongs(cached.recommendedSongs ?? []);
          setKeywords(cached.keywords);
          setTotalCount(cached.totalCount ?? 0);
          setIsLast((cached.recommendedSongs?.length ?? 0) >= (cached.totalCount ?? 0));
          setLoading(false);
        }
      }
    }
  }, [situation, location, searchQuery, sortBy]);

  const handleShowMore = useCallback(() => {
    if (isSearchMode) {
      if (!isLast && !loading) {
        fetchData(true);
      }
    } else {
      setLimit(prev => prev + 12);
    }
  }, [isSearchMode, isLast, loading, fetchData]);

  const handleDifficultyChange = useCallback((newDifficulty: "ALL" | Difficulty) => {
    setDifficulty(newDifficulty);
  }, []);

  const handleSortChange = useCallback((newSort: SortKey) => {
    setSortBy(newSort);
  }, []);

  const getTitle = () => {
    if (isSearchMode) {
      return searchQuery ? `"${searchQuery}" 검색 결과` : "검색 결과";
    }
    return "추천 곡 목록";
  };

  const getSubtitle = () => {
    if (isSearchMode) {
      return totalCount > 0
        ? `총 ${totalCount.toLocaleString()}개의 곡을 찾았습니다.`
        : "검색어를 입력해 주세요.";
    }
    return "선택하신 조건에 맞는 곡들을 추천해드립니다.";
  };

  const getEmptyMessage = () => {
    if (isSearchMode) {
      return searchQuery
        ? "검색 결과가 없습니다. 다른 검색어를 시도해보세요."
        : "검색어를 입력해 주세요.";
    }
    return "추천 결과가 없습니다.";
  };

  const getEmptyAction = () => {
    if (!isSearchMode) {
      return {
        text: "선호 조건을 다시 선택",
        action: () => window.location.href = "/explore"
      };
    }
    return undefined;
  };

  const showMoreAvailable = isSearchMode
    ? !isLast && totalCount > songs.length
    : totalCount > songs.length;

  return (
    <div className="bg-background text-foreground">
      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* 조건 태그 (추천 모드에서만) */}
        {isRecommendMode && (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{situation || "상황 없음"}</Badge>
              <Badge variant="outline">{location || "장소 없음"}</Badge>
              {genre && <Badge variant="outline">장르: {genre}</Badge>}
              <Button asChild size="sm" variant="ghost" className="ml-auto">
                <Link to="/explore">설정 변경 <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        )}

        <SongListView
          songs={songs}
          loading={loading}
          error={error}
          showFeaturedSection={isRecommendMode}
          showRecommendationKeywords={isRecommendMode}
          keywords={keywords}
          title={getTitle()}
          subtitle={getSubtitle()}
          emptyMessage={getEmptyMessage()}
          emptyActionText={getEmptyAction()?.text}
          onEmptyAction={getEmptyAction()?.action}
          difficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          showMoreButton={showMoreAvailable}
          onShowMore={handleShowMore}
          situation={situation}
          location={location}
        />
      </div>
    </div>
  );
}
