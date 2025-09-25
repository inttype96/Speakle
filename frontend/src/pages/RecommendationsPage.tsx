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
import Loading from "@/components/common/loading";

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
  const [totalPages, setTotalPages] = useState(0);
  const [isLast, setIsLast] = useState(false);

  const isSearchMode = Boolean(searchQuery);
  const isRecommendMode = Boolean(situation && location);

  const [difficulty, setDifficulty] = useState<"ALL" | Difficulty>("ALL");
  const [sortBy, setSortBy] = useState<SortKey>(isSearchMode ? "popularity" : "recommend");

  const fetchData = useCallback(async (append = false) => {
    if (!isSearchMode && !isRecommendMode) return;

    try {
      if (isSearchMode) {
        // 검색 모드
        const page = append ? currentPage + 1 : 0;
        // 검색 모드에서는 추천순이 없으므로 인기도로 변환, 나머지는 그대로
        let actualSortBy = sortBy;
        if (sortBy === 'recommend') {
          actualSortBy = 'popularity'; // 검색에서는 추천순 대신 인기순
        }
        const sortKey = `${actualSortBy},desc`;

        // 캐시 확인
        const cached = searchCache.get(searchQuery, page, sortKey) as SearchResult;

        if (cached && !append) {
          setSongs(cached.content);
          setTotalCount(cached.totalElements);
          setCurrentPage(cached.currentPage);
          setTotalPages(cached.totalPages);
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
        setTotalPages(result.totalPages);
        setIsLast(result.isLast);
        setKeywords(undefined);
      } else {
        // 추천 모드
        // 캐시 확인
        const cached = recommendCache.get(situation, location) as RecommendData;

        if (cached && !append) {
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
      setCurrentPage(0);

      // 정렬이 바뀌면 캐시를 무시하고 다시 가져오기
      if (isSearchMode) {
        const page = 0;
        // useEffect 내부에서도 동일한 로직 적용
        let actualSortBy = sortBy;
        if (sortBy === 'recommend') {
          actualSortBy = 'popularity';
        }
        const sortKey = `${actualSortBy},desc`;
        const cached = searchCache.get(searchQuery, page, sortKey) as SearchResult | null;
        if (!cached) {
          fetchData();
        } else {
          // 캐시가 있으면 바로 사용
          setSongs(cached.content);
          setTotalCount(cached.totalElements);
          setCurrentPage(cached.currentPage);
          setTotalPages(cached.totalPages);
          setIsLast(cached.isLast);
          setKeywords(undefined);
          setLoading(false);
        }
      } else {
        const cached = recommendCache.get(situation, location) as RecommendData | null;
        if (!cached) {
          fetchData();
        } else {
          // 캐시가 있으면 바로 사용
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

  const handlePageChange = useCallback((page: number) => {
    // 즉시 UI 상태 업데이트
    setCurrentPage(page);

    if (isSearchMode) {
      // 검색 모드에서는 페이지 변경 시 API 호출
      // handlePageChange에서도 동일한 로직 적용
      let actualSortBy = sortBy;
      if (sortBy === 'recommend') {
        actualSortBy = 'popularity';
      }
      const sortKey = `${actualSortBy},desc`;
      searchSongs({
        keyword: searchQuery,
        page,
        size: 20,
        sort: [sortKey]
      }).then(result => {
        setSongs(result.content);
        setTotalCount(result.totalElements);
        setTotalPages(result.totalPages);
        setIsLast(result.isLast);
      }).catch(() => {
        // Error handling can be added here if needed
      });
    }
  }, [isSearchMode, searchQuery, sortBy]);

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

  // 초기 로딩 상태일 때 (데이터가 없고 로딩 중일 때) 전체 화면 로딩 표시
  if (loading && songs.length === 0 && (isSearchMode || isRecommendMode)) {
    return (
      <>
        <Navbar />
        <Loading
          title={isSearchMode ? `"${searchQuery}" 검색 중` : "맞춤 음악 추천 생성 중"}
          subtitle={isSearchMode ? "검색 결과를 찾고 있습니다" : "선택하신 조건에 맞는 최적의 곡들을 분석하고 있습니다"}
          showProgress={true}
        />
      </>
    );
  }

  return (
    <div className="bg-background text-foreground font-sans">
      {/* Google Fonts Link */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />

      <div className={`mx-auto max-w-7xl px-4 ${isSearchMode ? 'py-12' : 'py-8'}`}>
        {/* 조건 태그 (추천 모드에서만) */}
        {isRecommendMode && (
          <div className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-black/10 backdrop-blur-sm rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-[#4B2199] text-white hover:bg-[#B5A6E0] hover:text-black transition-colors duration-200 font-['Pretendard'] font-medium px-3 py-1 text-sm">
                    {situation || "상황 없음"}
                  </Badge>
                  <Badge className="bg-[#4B2199] text-white hover:bg-[#B5A6E0] hover:text-black transition-colors duration-200 font-['Pretendard'] font-medium px-3 py-1 text-sm">
                    {location || "장소 없음"}
                  </Badge>
                  {genre && (
                    <Badge className="bg-[#4B2199] text-white hover:bg-[#B5A6E0] hover:text-black transition-colors duration-200 font-['Pretendard'] font-medium px-3 py-1 text-sm">
                      장르: {genre}
                    </Badge>
                  )}
                </div>
              </div>
              <Button asChild size="sm" className="bg-white/20 hover:bg-[#B5A6E0] hover:text-black text-white border-0 font-['Pretendard'] font-medium px-4 py-1.5 text-sm">
                <Link to="/explore">
                  설정 변경 <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        <SongListView
          songs={songs}
          loading={loading}
          error={error}
          showFeaturedSection={isRecommendMode || isSearchMode}
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
          searchQuery={searchQuery}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
