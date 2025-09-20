"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "@/components/common/navbar";
import { fetchSongDetail } from "@/services/songService";
import type { SongDetail } from "@/types/song";
import { createLearnedSong } from "@/services/songService";

// shadcn
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

// icons
import { Music2, Clock, Flame, Play, ChevronLeft, Gamepad2, Type, MicVocal, Keyboard } from "lucide-react";


const SONG_DETAIL_SAMPLE: SongDetail = {
  songId: "2gFvRmQiWg9fN9i74Q0aiw",
  title: "24K Magic",
  artists: "Bruno Mars",
  album: "24K Magic",
  albumImgUrl: "",
  popularity: 80,
  durationMs: 225983,
  lyrics: `Tonight
I just wanna take you higher
Throw your hands up in the sky
Let's set this party off right`,
  lyricChunks: [
    { id: "2gFv..._0",  startTimeMs: 20,    english: "Tonight",                                        korean: "한국어 가사" },
    { id: "2gFv..._1",  startTimeMs: 4540,  english: "I just wanna take you higher",                   korean: "한국어 가사" },
    { id: "2gFv..._2",  startTimeMs: 9050,  english: "Throw your hands up in the sky",                 korean: "한국어 가사" },
    { id: "2gFv..._3",  startTimeMs: 13040, english: "Let's set this party off right",                 korean: "한국어 가사" },
    { id: "2gFv..._4",  startTimeMs: 23570, english: "Put your pinky rings up to the moon",            korean: "한국어 가사" },
    { id: "2gFv..._5",  startTimeMs: 28390, english: "Girls, what y'all tryna do?",                    korean: "한국어 가사" },
    { id: "2gFv..._6",  startTimeMs: 32060, english: "24-karat magic in the air",                      korean: "한국어 가사" },
    { id: "2gFv..._7",  startTimeMs: 37990, english: "Head to toe so player",                          korean: "한국어 가사" },
  ],
};


const msToMinSec = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function SongDetailPage() {
  const { songId = "" } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  console.log("SongDetailPage Debug:", {
    songId,
    url: window.location.href,
    pathname: window.location.pathname
  });

  // URL 쿼리(raw) -> situation/location이 없을 때 null이 넘어가면 백엔드에서 타입 에러가 날 수 있어서 안전하게 undefined로 정규화해서 전달:
  const situation = sp.get("situation") ?? undefined;
  const location  = sp.get("location") ?? undefined;

  const useMock = (sp.get("mock") === "1"); // ✅ ?mock=1 이면 백엔드 호출 없이 샘플 사용

  const [data, setData] = useState<SongDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [openLearn, setOpenLearn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 내부 상태
const [initLearningLoading, setInitLearningLoading] = useState(false);
const [learned, setLearned] = useState<null | { learnedSongId: number }>(null);

// 버튼 onClick 핸들러 교체
const handleOpenLearn = async () => {
  setOpenLearn(true);               // 모달 열기
  setInitLearningLoading(true);     // 모달 상단에 로딩 표시용
  try {
    const accessToken = localStorage.getItem("access_token") || undefined;
    const r = await createLearnedSong(
      { songId, situation, location },
      accessToken
    );
    setLearned({ learnedSongId: r.learnedSongId });
  } catch (e) {
    console.error(e);
    // 필요하면 토스트/에러 UI 추가
  } finally {
    setInitLearningLoading(false);
  }
};

  useEffect(() => {
    // 페이지 진입 시 스크롤을 최상단으로
    window.scrollTo(0, 0);

    let alive = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        if (useMock) {
        // ✅ 백엔드 대신 로컬 샘플
        if (!alive) return;
        setData(SONG_DETAIL_SAMPLE);
        return;
      }
        const detail = await fetchSongDetail(songId, { situation, location });
        if (!alive) return;
        setData(detail);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "곡 정보를 불러오지 못했습니다.");
      } finally {
        alive && setLoading(false);
      }
    }
    if (songId) run();
    return () => { alive = false; };
  }, [songId, situation, location]);

  // 왼쪽: 원문 영어 가사
  const englishOnly = useMemo(() => (data?.lyrics || "").trim(), [data]);

  // 오른쪽: 영어 1줄 + 한국어 1줄
  const biLines = useMemo(() => {
    const chunks = data?.lyricChunks ?? [];
    return chunks.map((c) => ({
      id: c.id,
      en: (c.english || "").trim(),
      ko: (c.korean || "").trim(), // 없으면 빈 문자열
    }));
  }, [data]);

  const qsRaw = sp.toString(); // 현재 쿼리를 그대로 다음 페이지로 넘길 때 사용

  return (
    <div className="bg-background text-foreground">
      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to={`/recommendations${qsRaw ? `?${qsRaw}` : ""}`}>
              <ChevronLeft className="mr-1 h-4 w-4" /> 추천 목록으로
            </Link>
          </Button>

          {/* 우측 상단 학습 버튼 */}
          <Button size="lg" className="px-5" onClick={() => handleOpenLearn()}>
            <Gamepad2 className="mr-2 h-5 w-5" />
            Speakle과 집중 학습하기
          </Button>
        </div>

        {/* 상단: 앨범/타이틀/메타 */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* 앨범 커버 */}
            <div className="p-4">
              <div className="relative aspect-[16/10] md:aspect-square overflow-hidden rounded-md bg-muted">
                {loading ? (
                  <Skeleton className="absolute inset-0" />
                ) : data?.albumImgUrl ? (
                  <img src={data.albumImgUrl} alt={data.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center"><Music2 className="h-8 w-8" /></div>
                )}
                {!loading && (
                  <Button size="icon" variant="secondary" className="absolute left-3 top-3 rounded-full h-9 w-9">
                    <Play className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* 타이틀/아티스트/메타 */}
            <div className="md:col-span-2 p-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-7 w-2/3" />
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : error ? (
                <div className="text-destructive text-sm">{error}</div>
              ) : data ? (
                <>
                  <CardHeader className="p-0">
                    <CardTitle className="text-2xl truncate">{data.title}</CardTitle>
                    <div className="text-sm text-muted-foreground truncate">{data.artists} · {data.album}</div>
                  </CardHeader>
                  <CardContent className="p-0 mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{msToMinSec(data.durationMs)}</span>
                    <span className="inline-flex items-center gap-1"><Flame className="h-4 w-4" />{data.popularity}</span>
                    {situation && <Badge variant="outline">{situation}</Badge>}
                    {location && <Badge variant="outline">{location}</Badge>}
                  </CardContent>
                </>
              ) : null}
            </div>
          </div>
        </Card>

        {/* 탭 (스크린샷처럼 상단에 '가사 | 학습 내용' 탭 표시) */}
        <Tabs defaultValue="lyrics" className="w-full" onFocus={(e) => e.preventDefault()}>
          <TabsList className="mx-auto block w-fit">
            <TabsTrigger value="lyrics" tabIndex={-1}>가사</TabsTrigger>
            <TabsTrigger value="notes" disabled tabIndex={-1}>학습 내용</TabsTrigger>
          </TabsList>

          <TabsContent value="lyrics" className="space-y-4">
            {/* 두 컬럼: 왼쪽 영어 전체 / 오른쪽 영-한 한 줄씩 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 왼쪽: 영어 전체 */}
              <Card className="bg-muted/40">
                <CardHeader>
                  <CardTitle className="text-base">영어 가사</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                    </div>
                  ) : (
                    <ScrollArea className="h-[60vh] pr-3">
                      <pre className="whitespace-pre-wrap leading-7 text-sm">{englishOnly}</pre>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* 오른쪽: 영-한 줄바꿈 */}
              <Card className="bg-muted/40">
                <CardHeader>
                  <CardTitle className="text-base">영·한 가사</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                    </div>
                  ) : (
                    <ScrollArea className="h-[60vh] pr-3">
                      <div className="space-y-3">
                        {biLines.map(({ id, en, ko }) => (
                          <div key={id}>
                            <div className="text-sm">{en}</div>
                            <div className="text-sm text-muted-foreground">{ko || " "}</div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes">
            {/* 학습 내용 탭은 이후 연동 */}
            <Card><CardContent className="py-10 text-sm text-muted-foreground">학습 내용은 추후 제공될 예정입니다.</CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 학습 모달 */}
    <LearnDialog
        open={openLearn}
        initializing={initLearningLoading}
        learnedId={learned?.learnedSongId}
        onOpenChange={setOpenLearn}
        onSelect={(mode) => {
            const path =
            mode === "cloze" ? "/learn/quiz" :
            mode === "speaking" ? "/learn/speaking" :
            "/learn/dictation";

            const qs = new URLSearchParams();
            qs.set("songId", songId);                         // ✅ 필수
            if (learned?.learnedSongId)
            qs.set("learnedSongId", String(learned.learnedSongId)); // ✅ 세션 id
            if (situation) qs.set("situation", situation);    // ✅ 선택값 유지
            if (location)  qs.set("location", location);      // ✅ 선택값 유지

            navigate(`${path}?${qs.toString()}`);

        }}
    />
    </div>
  );
}

function LearnDialog({
  open,
  onOpenChange,
  onSelect,
  initializing,
  learnedId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (mode: "cloze" | "speaking" | "dictation") => void;
  initializing?: boolean;
  learnedId?: number | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>학습 모드를 선택하세요</DialogTitle>
          <DialogDescription>
            선택 시 현재 상황·장소 쿼리를 유지해 이동합니다.
            {initializing && (
              <span className="ml-2 text-xs text-muted-foreground">
                (세션 준비 중…)
              </span>
            )}
            {learnedId ? (
              <span className="ml-2 text-xs text-muted-foreground">
                세션 #{learnedId} 준비 완료
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => onSelect("cloze")}
            disabled={initializing}
          >
            <Type className="h-5 w-5" />
            Cloze
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => onSelect("speaking")}
            disabled={initializing}
          >
            <MicVocal className="h-5 w-5" />
            Speaking
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => onSelect("dictation")}
            disabled={initializing}
          >
            <Keyboard className="h-5 w-5" />
            Dictation
          </Button>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
