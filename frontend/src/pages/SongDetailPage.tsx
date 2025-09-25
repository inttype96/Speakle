"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "@/components/common/navbar";
import Loading from "@/components/common/loading";
import { fetchSongDetail, fetchLearningContent } from "@/services/songService";
import type { SongDetail, LearningContent } from "@/types/song";
import { createLearnedSong } from "@/services/songService";
import SynchronizedLyrics from "@/components/song/SynchronizedLyrics";
import PlaylistSelectionModal from "@/components/playlists/PlaylistSelectionModal";

// shadcn
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LearningContentTabs from "@/components/song/LearningContentTabs";
import SpotifyWebPlayer from "@/components/song/SpotifyWebPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

// icons
import { Clock, Flame, ChevronLeft, Gamepad2, Type, MicVocal, Keyboard, Plus } from "lucide-react";


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
    { id: "2gFv..._0", startTimeMs: 20, english: "Tonight", korean: "한국어 가사" },
    { id: "2gFv..._1", startTimeMs: 4540, english: "I just wanna take you higher", korean: "한국어 가사" },
    { id: "2gFv..._2", startTimeMs: 9050, english: "Throw your hands up in the sky", korean: "한국어 가사" },
    { id: "2gFv..._3", startTimeMs: 13040, english: "Let's set this party off right", korean: "한국어 가사" },
    { id: "2gFv..._4", startTimeMs: 23570, english: "Put your pinky rings up to the moon", korean: "한국어 가사" },
    { id: "2gFv..._5", startTimeMs: 28390, english: "Girls, what y'all tryna do?", korean: "한국어 가사" },
    { id: "2gFv..._6", startTimeMs: 32060, english: "24-karat magic in the air", korean: "한국어 가사" },
    { id: "2gFv..._7", startTimeMs: 37990, english: "Head to toe so player", korean: "한국어 가사" },
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


  // URL 쿼리(raw) -> situation/location이 없을 때 null이 넘어가면 백엔드에서 타입 에러가 날 수 있어서 안전하게 undefined로 정규화해서 전달:
  const situation = sp.get("situation") ?? undefined;
  const location = sp.get("location") ?? undefined;

  const useMock = (sp.get("mock") === "1"); // ✅ ?mock=1 이면 백엔드 호출 없이 샘플 사용

  const [data, setData] = useState<SongDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [openLearn, setOpenLearn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 학습 내용 관련 상태
  const [learningContent, setLearningContent] = useState<LearningContent | null>(null);
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningError, setLearningError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("lyrics");

  // 컴포넌트 내부 상태
  const [initLearningLoading, setInitLearningLoading] = useState(false);
  const [learned, setLearned] = useState<null | { learnedSongId: number }>(null);

  // 가사 동기화를 위한 상태
  const [currentPlayTime, setCurrentPlayTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 플레이리스트 추가 모달 상태
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // 스포티파이 플레이어 시간 업데이트 핸들러
  const handleTimeUpdate = (currentTime: number, playing: boolean) => {
    console.log('🎧 Spotify time update:', { currentTime, playing });
    setCurrentPlayTime(currentTime);
    setIsPlaying(playing);
  };

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

  // 학습 내용 탭이 활성화됐을 때 API 호출 (폴링으로 LLM 처리 완료 대기)
  const fetchLearningContentData = async () => {
    if (learningContent || learningLoading || !songId) return;

    setLearningLoading(true);
    setLearningError(null);

    try {
      const accessToken = localStorage.getItem("access_token") || undefined;

      // 최대 30초 동안 3초마다 폴링하여 LLM 처리 완료 대기
      const maxRetries = 10;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          const content = await fetchLearningContent(songId, { situation, location }, accessToken);
          setLearningContent(content);
          return; // 성공하면 종료
        } catch (e: any) {
          retryCount++;

          // LLM 처리 중이라는 메시지가 있으면 계속 대기
          if (e?.message?.includes("처리 중") || e?.message?.includes("생성 중") || retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기
            continue;
          }

          // 다른 에러는 바로 throw
          throw e;
        }
      }

      // 최대 재시도 횟수 초과
      throw new Error("학습 내용 생성에 시간이 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.");

    } catch (e: any) {
      console.error("Learning content fetch error:", e);
      setLearningError(e?.message ?? "학습 내용을 불러오지 못했습니다.");
    } finally {
      setLearningLoading(false);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "notes" && !learningContent && !learningLoading) {
      fetchLearningContentData();
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
          console.log('🧪 Using mock data:', SONG_DETAIL_SAMPLE);
          console.log('🎼 Mock lyric chunks count:', SONG_DETAIL_SAMPLE?.lyricChunks?.length || 0);
          setData(SONG_DETAIL_SAMPLE);
          return;
        }
        const detail = await fetchSongDetail(songId, { situation, location });
        if (!alive) return;
        console.log('📊 Song detail loaded:', detail);
        console.log('🎼 Lyric chunks count:', detail?.lyricChunks?.length || 0);
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

  // 이제 SynchronizedLyrics 컴포넌트에서 직접 lyricChunks를 사용합니다

  const qsRaw = sp.toString(); // 현재 쿼리를 그대로 다음 페이지로 넘길 때 사용

  // 검색으로 온 경우와 추천으로 온 경우 구분
  const searchQuery = sp.get("q");
  const isFromSearch = Boolean(searchQuery);
  const backUrl = isFromSearch ? `/search${qsRaw ? `?${qsRaw}` : ""}` : `/recommendations${qsRaw ? `?${qsRaw}` : ""}`;
  const backText = isFromSearch ? "검색 결과로" : "추천 목록으로";

  // 학습 내용 로딩 중일 때 전체 화면 로딩 표시
  if (learningLoading && activeTab === "notes") {
    return (
      <>
        <Navbar />
        <Loading
          title="AI가 학습 내용을 생성하고 있어요"
          subtitle="이 곡의 단어, 문장, 표현, 관용구를 분석하고 있습니다"
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

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6 min-h-screen">
        {/* 상단 헤더 */}
        <div className="flex items-center">
          <Button variant="ghost" asChild className="text-white hover:bg-white/10 font-['Pretendard'] font-medium rounded-xl transition-colors duration-200">
            <Link to={backUrl}>
              <ChevronLeft className="mr-2 h-4 w-4" /> {backText}
            </Link>
          </Button>
        </div>

        {/* 상단: 앨범/타이틀/메타 */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-0">
          {/* 앨범 커버 */}
          <div className="p-4 md:pr-2">
            <div className="relative aspect-square overflow-hidden rounded-md bg-muted max-w-[200px] mx-auto md:mx-0">
              {loading ? (
                <Skeleton className="absolute inset-0" />
              ) : (() => {
                // 앨범 이미지 유효성 검사
                const hasValidImage = data?.albumImgUrl &&
                  data.albumImgUrl !== "no" &&
                  data.albumImgUrl !== "null" &&
                  data.albumImgUrl !== "none" &&
                  data.albumImgUrl.trim() !== "";

                return (
                  <img
                    src={hasValidImage ? data.albumImgUrl : "/albumBasicCover.png"}
                    alt={data?.title || ""}
                    className="h-full w-full object-cover"
                  />
                );
              })()}
            </div>
          </div>

          {/* 타이틀/아티스트/메타 */}
          <div className="p-4">
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
                  <CardTitle className="text-2xl font-bold truncate text-white font-['Pretendard']">{data.title}</CardTitle>
                  <div className="text-base text-gray-300 truncate font-['Pretendard'] font-medium">
                    {data.artists.replace(/[\[\]']/g, '')} · {data.album}
                  </div>
                </CardHeader>
                <CardContent className="p-0 mt-2 space-y-3">
                  <div className="flex items-center gap-4 text-sm text-gray-400 font-['Pretendard'] font-medium">
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{msToMinSec(data.durationMs)}</span>
                    <span className="inline-flex items-center gap-1.5"><Flame className="h-4 w-4" />{data.popularity}</span>
                    {situation && <Badge className="bg-[#4B2199] text-white hover:bg-[#B5A6E0] hover:text-black transition-colors duration-200 font-['Pretendard'] font-medium px-3 py-1 text-sm rounded-xl">{situation}</Badge>}
                    {location && <Badge className="bg-[#4B2199] text-white hover:bg-[#B5A6E0] hover:text-black transition-colors duration-200 font-['Pretendard'] font-medium px-3 py-1 text-sm rounded-xl">{location}</Badge>}
                  </div>

                  {/* 스포티파이 플레이어 */}
                  <div className="max-w-md">
                    <SpotifyWebPlayer
                      trackId={data.songId}
                      trackName={data.title}
                      artistName={data.artists}
                      onTimeUpdate={handleTimeUpdate}
                    />
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex flex-col gap-2 max-w-md">
                    {/* 학습 버튼 */}
                    <Button size="lg" onClick={() => handleOpenLearn()} className="bg-[#4B2199] hover:bg-[#B5A6E0] hover:text-black text-white font-['Pretendard'] font-bold rounded-xl transition-all duration-300 hover:scale-105">
                      <Gamepad2 className="mr-2 h-5 w-5" />
                      Speakle과 집중 학습하기
                    </Button>

                    {/* 플레이리스트 추가 버튼 */}
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setShowPlaylistModal(true)}
                      className="border-white/20 text-white hover:bg-white/10 font-['Pretendard'] font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      플레이리스트에 추가
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : null}
          </div>
          </div>
        </div>

        {/* 탭 (스크린샷처럼 상단에 '가사 | 학습 내용' 탭 표시) */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" onFocus={(e) => e.preventDefault()}>
          <TabsList className="mx-auto block w-fit bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl font-['Pretendard']">
            <TabsTrigger value="lyrics" tabIndex={-1} className="text-white data-[state=active]:bg-[#4B2199] data-[state=active]:text-white font-medium">가사</TabsTrigger>
            <TabsTrigger value="notes" tabIndex={-1} className="text-white data-[state=active]:bg-[#4B2199] data-[state=active]:text-white font-medium">학습 내용</TabsTrigger>
          </TabsList>

          <TabsContent value="lyrics" className="space-y-4 w-full min-w-0">
            <div className="w-full min-w-[800px]">
              {/* 시간 동기화된 영한 가사 */}
              <Card className="bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl w-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-['Pretendard'] font-bold text-white">
                  가사 lyrics
                  {isPlaying && (
                    <div className="w-2 h-2 bg-[#4B2199] rounded-full animate-pulse" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : data?.lyricChunks && data.lyricChunks.length > 0 ? (
                  <>
                    <SynchronizedLyrics
                      songId={data.songId}
                      lyricChunks={data.lyricChunks}
                      currentTime={currentPlayTime}
                      isPlaying={isPlaying}
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center h-[60vh] text-gray-300">
                      <p className="font-['Pretendard'] font-medium">동기화된 가사를 불러올 수 없습니다.</p>
                    </div>
                  </>
                )}
              </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="w-full min-w-0">
            <div className="w-full min-w-[800px]">
              {/* 학습 내용 탭 */}
              {learningError ? (
                <Card className="bg-black/20 backdrop-blur-xl border border-white/10 w-full">
                  <CardContent className="py-10 text-center space-y-3">
                    <p className="text-sm text-red-400 font-['Pretendard'] font-medium">{learningError}</p>
                    <Button variant="outline" onClick={fetchLearningContentData} className="border-white/20 text-white hover:bg-white/10 font-['Pretendard'] font-semibold rounded-xl">
                      다시 시도
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="w-full">
                  <LearningContentTabs
                    learningContent={learningContent || undefined}
                    loading={false}
                  />
                </div>
              )}
            </div>
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
          if (location) qs.set("location", location);      // ✅ 선택값 유지

          navigate(`${path}?${qs.toString()}`);

        }}
      />

      {/* 플레이리스트 선택 모달 */}
      <PlaylistSelectionModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        songId={songId}
        songTitle={data?.title}
        onSuccess={() => {
          // 성공 후 필요한 액션이 있다면 여기에 추가
          console.log("노래가 플레이리스트에 성공적으로 추가되었습니다.");
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
