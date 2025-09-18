"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchRecommendations } from "@/services/recommend";
import type { Song, Difficulty } from "@/types/recommend";
import Navbar from "@/components/common/navbar";

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

// utils
const msToMinSec = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const DIFFICULTY_MAP: Record<Difficulty, { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }> = {
  LOW: { label: "쉬움", variant: "secondary" },
  MEDIUM: { label: "보통", variant: "default" },
  HIGH: { label: "어려움", variant: "destructive" },
};

type SortKey = "recommend" | "popularity" | "duration" | "learn";
const sorters: Record<SortKey, (a: Song, b: Song) => number> = {
  recommend: (a, b) => b.recommendScore - a.recommendScore,
  popularity: (a, b) => b.popularity - a.popularity,
  duration: (a, b) => a.durationMs - b.durationMs,
  learn: (a, b) => b.learnCount - a.learnCount,
};

export default function RecommendationsPage() {
  const [sp] = useSearchParams();
  const situation = sp.get("situation") ?? "";
  const location = sp.get("location") ?? "";
  const genre = sp.get("genre") ?? ""; // 표시용

  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [songs, setSongs] = useState<Song[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // UI 필터/정렬 (클라이언트 측)
  const [difficulty, setDifficulty] = useState<"ALL" | Difficulty>("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("recommend");

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRecommendations({
          situation,
          location,
          limit,
        });
        if (!alive) return;
        setSongs(data.recommendedSongs ?? []);
        setTotalCount(data.totalCount ?? 0);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "추천 결과를 불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    if (situation && location) run();
    return () => {
      alive = false;
    };
  }, [situation, location, limit]);

  const filteredSorted = useMemo(() => {
    const base = difficulty === "ALL" ? songs : songs.filter((s) => s.difficulty === difficulty);
    const copy = [...base];
    copy.sort(sorters[sortBy]);
    return copy;
  }, [songs, difficulty, sortBy]);

  const top = filteredSorted[0];
  const rest = filteredSorted.slice(1, 5); // 상위 결과 우측 리스트
  const gridList = filteredSorted.slice(0); // 하단 카드 그리드

  return (
    <div className="bg-background text-foreground">
      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* 헤더 */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">추천 곡 목록</h1>
          <p className="text-sm text-muted-foreground">선택하신 조건에 맞는 곡들을 추천해드립니다.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline">{situation || "상황 없음"}</Badge>
            <Badge variant="outline">{location || "장소 없음"}</Badge>
            {genre && <Badge variant="outline">장르: {genre}</Badge>}
            <Button asChild size="sm" variant="ghost" className="ml-auto">
              <Link to="/explore">설정 변경 <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        {/* 상위 결과 */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                <div className="p-4"><Skeleton className="h-48 w-full rounded-lg" /></div>
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
            ) : error ? (
              <div className="p-6 text-sm text-destructive">{error}</div>
            ) : !top ? (
              <div className="p-6 text-sm text-muted-foreground">
                추천 결과가 없습니다. <Link to="/explore" className="underline">선호 조건을 다시 선택</Link>해 보세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* 왼쪽 메인 카드 */}
                <div className="p-4">
                  <Card className="overflow-hidden">
                    <div className="aspect-[16/10] bg-muted relative">
                      {top.albumImgUrl ? (
                        <img src={top.albumImgUrl} alt={top.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><Music2 className="h-10 w-10" /></div>
                      )}
                      <div className="absolute left-3 top-3">
                        <Badge variant={DIFFICULTY_MAP[top.difficulty].variant || "default"}>
                          {DIFFICULTY_MAP[top.difficulty].label}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="truncate">{top.title}</CardTitle>
                      <p className="text-sm text-muted-foreground truncate">곡 · {top.artists}</p>
                    </CardHeader>
                    <CardContent className="pt-0 flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{msToMinSec(top.durationMs)}</span>
                        <span className="inline-flex items-center gap-1"><Flame className="h-4 w-4" />{top.popularity}</span>
                      </div>
                      <Button size="icon" variant="ghost" className="rounded-full"><Heart className="h-5 w-5" /></Button>
                    </CardContent>
                  </Card>
                </div>

                {/* 오른쪽 리스트 */}
                <div className="lg:col-span-2 p-4">
                  <div className="px-1 pt-2 pb-3 text-sm font-medium">상위 결과</div>
                  <ScrollArea className="max-h-[220px] pr-2">
                    <div className="space-y-2">
                      {rest.map((s) => (
                        <div key={s.songId} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
                          <div className="h-12 w-12 rounded-md overflow-hidden bg-muted">
                            {s.albumImgUrl ? <img src={s.albumImgUrl} alt={s.title} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><Music2 className="h-4 w-4" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">{s.title}</span>
                              <Badge variant={DIFFICULTY_MAP[s.difficulty].variant || "default"}>{DIFFICULTY_MAP[s.difficulty].label}</Badge>
                            </div>
                            <div className="truncate text-sm text-muted-foreground">{s.artists}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{msToMinSec(s.durationMs)}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 필터 & 정렬 바 */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" /> 필터 및 정렬
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* 정렬 */}
            <Select value={sortBy} onValueChange={(v: SortKey) => setSortBy(v)}>
              <SelectTrigger className="w-[110px]"><SelectValue placeholder="정렬" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recommend">추천순</SelectItem>
                <SelectItem value="popularity">인기순</SelectItem>
                <SelectItem value="duration">재생시간</SelectItem>
                <SelectItem value="learn">학습수</SelectItem>
              </SelectContent>
            </Select>

            {/* 장르는 표시만 (쿼리에서 넘어옴) */}
            <Select disabled value={genre || "all"} onValueChange={() => {}}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="모든 장르" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 장르</SelectItem>
                {genre && <SelectItem value={genre}>{genre}</SelectItem>}
              </SelectContent>
            </Select>

            {/* 난이도 필터 (클라 측) */}
            <Select value={difficulty} onValueChange={(v: "ALL" | Difficulty) => setDifficulty(v)}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="모든 난이도" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">모든 난이도</SelectItem>
                <SelectItem value="LOW">쉬움</SelectItem>
                <SelectItem value="MEDIUM">보통</SelectItem>
                <SelectItem value="HIGH">어려움</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

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
                <SongCard key={s.songId} song={s} />
              ))}
            </div>

            {/* 더 보기 */}
            {totalCount > songs.length && (
              <div className="flex justify-center pt-6">
                <Button variant="outline" onClick={() => setLimit((n) => n + 12)}>더 보기</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SongCard({ song }: { song: Song }) {
  const diff = DIFFICULTY_MAP[song.difficulty];
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] bg-muted">
        {song.albumImgUrl ? (
          <img src={song.albumImgUrl} alt={song.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center"><Music2 className="h-8 w-8" /></div>
        )}
        <div className="absolute left-3 top-3">
          <Badge variant={diff.variant || "default"}>{diff.label}</Badge>
        </div>
        <Button size="icon" variant="secondary" className="absolute right-3 top-3 rounded-full h-8 w-8">
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base leading-tight line-clamp-1">{song.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-1">{song.artists}</p>
      </CardHeader>
      <CardContent className="pt-0 flex items-center justify-between text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{msToMinSec(song.durationMs)}</span>
        <span className="inline-flex items-center gap-1"><Flame className="h-4 w-4" />{song.popularity}</span>
      </CardContent>
    </Card>
  );
}
