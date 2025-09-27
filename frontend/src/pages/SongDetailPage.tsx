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
import { Clock, Flame, ChevronLeft, Gamepad2, Type, MicVocal, Keyboard, Plus, CheckCircle } from "lucide-react";


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

  // 개별 학습 모드 로딩 상태
  const [quizLoading, setQuizLoading] = useState(false);
  const [speakingLoading, setSpeakingLoading] = useState(false);
  const [dictationLoading, setDictationLoading] = useState(false);

  // 직접 학습 모달 상태
  const [directLearnModal, setDirectLearnModal] = useState<{
    open: boolean;
    mode: "cloze" | "speaking" | "dictation" | null;
    preparing: boolean;
    waitingForSession: boolean;
  }>({
    open: false,
    mode: null,
    preparing: false,
    waitingForSession: false
  });

  // learned 상태와 learningContent가 모두 준비되었을 때 대기 중인 직접 학습 모달 처리
  useEffect(() => {
    console.log("useEffect 실행", {
      learned: learned?.learnedSongId,
      learningContent: !!learningContent,
      waitingForSession: directLearnModal.waitingForSession,
      mode: directLearnModal.mode
    });

    if (learned?.learnedSongId && learningContent && directLearnModal.waitingForSession) {
      console.log("세션과 학습 내용 모두 준비 완료, 페이지 이동 시작");

      // 준비 완료 상태로 변경
      setDirectLearnModal(prev => ({
        ...prev,
        preparing: false,
        waitingForSession: false
      }));

      // 잠시 후 페이지 이동
      setTimeout(() => {
        const path = {
          cloze: "/learn/quiz",
          speaking: "/learn/speaking",
          dictation: "/learn/dictation"
        }[directLearnModal.mode!];

        const qs = new URLSearchParams();
        qs.set("songId", songId);
        qs.set("learnedSongId", String(learned.learnedSongId));
        if (situation) qs.set("situation", situation);
        if (location) qs.set("location", location);

        console.log("페이지 이동", path);
        navigate(`${path}?${qs.toString()}`);

        // 모달 닫기
        setDirectLearnModal({
          open: false,
          mode: null,
          preparing: false,
          waitingForSession: false
        });
      }, 800);
    }
  }, [learned, learningContent, directLearnModal.waitingForSession, directLearnModal.mode, songId, situation, location, navigate]);

  // 가사 동기화를 위한 상태
  const [currentPlayTime, setCurrentPlayTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 플레이리스트 추가 모달 상태
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // 스포티파이 플레이어 시간 업데이트 핸들러
  const handleTimeUpdate = (currentTime: number, playing: boolean) => {
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

  // 학습 세션 생성 및 페이지 이동
  const handleDirectLearn = async (mode: "cloze" | "speaking" | "dictation") => {
    console.log("handleDirectLearn 호출됨", { mode, learned, learnedSongId: learned?.learnedSongId });

    // 세션과 학습 내용이 모두 준비되어 있으면 바로 이동
    if (learned?.learnedSongId && learningContent) {
      console.log("세션과 학습 내용이 모두 준비됨, 바로 이동");
      const path = {
        cloze: "/learn/quiz",
        speaking: "/learn/speaking",
        dictation: "/learn/dictation"
      }[mode];

      const qs = new URLSearchParams();
      qs.set("songId", songId);
      qs.set("learnedSongId", String(learned.learnedSongId));
      if (situation) qs.set("situation", situation);
      if (location) qs.set("location", location);

      navigate(`${path}?${qs.toString()}`);
      return;
    }

    // 세션이나 학습 내용이 준비되지 않았으면 모달 띄우고 준비 진행
    if (learned?.learnedSongId) {
      console.log("세션은 준비됨, 학습 내용 대기 중");
    } else {
      console.log("세션이 준비되지 않음, 세션 생성 시작");
    }
    setDirectLearnModal({
      open: true,
      mode,
      preparing: true,
      waitingForSession: true
    });

    // 세션이 없으면 세션 생성, 있으면 학습 내용만 생성
    try {
      if (!learned?.learnedSongId) {
        console.log("세션 생성 중...");
        const accessToken = localStorage.getItem("access_token") || undefined;
        const r = await createLearnedSong(
          { songId, situation, location },
          accessToken
        );
        setLearned({ learnedSongId: r.learnedSongId });
      }

      // 학습 내용 생성
      if (!learningContent) {
        console.log("학습 내용 생성 중...");
        await fetchLearningContentData();
        console.log("학습 내용 생성 완료");
      }
    } catch (e) {
      console.error(e);
      setDirectLearnModal({
        open: false,
        mode: null,
        preparing: false,
        waitingForSession: false
      });
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
    <div className="bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />

      <div className="mx-auto px-4 py-6 space-y-6" style={{ width: '100%', maxWidth: '1024px', minWidth: 0 }}>
        {/* 상단 헤더 */}
        <div className="flex items-center">
          <Button variant="ghost" asChild>
            <Link to={backUrl}>
              <ChevronLeft className="mr-1 h-4 w-4" /> {backText}
            </Link>
          </Button>
        </div>

        {/* 상단: 앨범/타이틀/메타/학습버튼 */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_280px] gap-0">
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
                  <CardTitle className="text-xl truncate">{data.title}</CardTitle>
                  <div className="text-sm text-muted-foreground truncate">
                    {data.artists.replace(/[\[\]']/g, '')} · {data.album}
                  </div>
                </CardHeader>
                <CardContent className="p-0 mt-2 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{msToMinSec(data.durationMs)}</span>
                    <span className="inline-flex items-center gap-1"><Flame className="h-4 w-4" />{data.popularity}</span>
                    {situation && <Badge variant="outline">{situation}</Badge>}
                    {location && <Badge variant="outline">{location}</Badge>}
                  </div>

                  {/* 스포티파이 플레이어 */}
                  <div className="w-full max-w-lg">
                    <SpotifyWebPlayer
                      trackId={data.songId}
                      trackName={data.title}
                      artistName={data.artists.replace(/[\[\]']/g, '')}
                      onTimeUpdate={handleTimeUpdate}
                    />
                  </div>

                  {/* 플레이리스트 추가 버튼 */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowPlaylistModal(true)}
                    className="w-full max-w-lg"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    플레이리스트에 추가
                  </Button>
                </CardContent>
              </>
            ) : null}
          </div>

          {/* 학습 버튼들 */}
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : data ? (
              <div className="space-y-3">
                {/* 학습 버튼들 그리드 */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  {/* Speakle과 집중 학습하기 */}
                  <div className="h-20 flex items-start justify-start bg-black text-white font-semibold text-xs leading-snug border border-muted rounded-md p-3 cursor-pointer hover:bg-muted/10 transition-colors font-['Pretendard']"
                       onClick={() => handleOpenLearn()}>
                    <div className="text-left">
                      Speakle과<br />집중 학습하기
                    </div>
                  </div>

                  {/* 빈칸 퀴즈 */}
                  <div className="h-20 flex flex-col items-start justify-start rounded-md bg-[#6C5F8D]/60 hover:bg-[#6C5F8D]/80 p-3 cursor-pointer transition-colors"
                       onClick={() => handleDirectLearn("cloze")}>
                    <div className="font-bold text-xs mb-2 text-white font-['Pretendard']">빈칸 퀴즈</div>
                    {quizLoading ? (
                      <div className="flex items-center justify-center w-full h-full">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <CheckCircle className="h-5 w-5 mb-1 text-white" />
                        <div className="text-xs text-white/80 text-center font-['Pretendard']">Fill in the ___</div>
                      </div>
                    )}
                  </div>

                  {/* Speaking 연습 */}
                  <div className="h-20 flex flex-col items-start justify-start rounded-md bg-[#6C5F8D]/60 hover:bg-[#6C5F8D]/80 p-3 cursor-pointer transition-colors"
                       onClick={() => handleDirectLearn("speaking")}>
                    <div className="font-bold text-xs mb-2 text-white font-['Pretendard']">Speaking</div>
                    {speakingLoading ? (
                      <div className="flex items-center justify-center w-full h-full">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <MicVocal className="h-5 w-5 mb-1 text-white" />
                        
                      </div>
                    )}
                  </div>

                  {/* 딕테이션 게임 */}
                  <div className="h-20 flex flex-col items-start justify-start rounded-md bg-[#6C5F8D]/60 hover:bg-[#6C5F8D]/80 p-3 cursor-pointer transition-colors"
                       onClick={() => handleDirectLearn("dictation")}>
                    <div className="font-bold text-xs mb-2 text-white font-['Pretendard']">딕테이션</div>
                    {dictationLoading ? (
                      <div className="flex items-center justify-center w-full h-full">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <Keyboard className="h-5 w-5 mb-1 text-white" />
                        
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* 탭 (스크린샷처럼 상단에 '가사 | 학습 내용' 탭 표시) */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" onFocus={(e) => e.preventDefault()}>
          <TabsList className="mx-auto block w-fit">
            <TabsTrigger value="lyrics" tabIndex={-1}>가사</TabsTrigger>
            <TabsTrigger value="notes" tabIndex={-1}>학습 내용</TabsTrigger>
          </TabsList>

          <TabsContent value="lyrics" className="space-y-4">
            {/* 시간 동기화된 영한 가사 */}
            <Card className="bg-gradient-to-br from-indigo-950/40 to-slate-900/30 backdrop-blur-xl border border-indigo-400/40 shadow-2xl w-full max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  영어 동기화 가사
                  {isPlaying && (
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
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
                    <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
                      <p>동기화된 가사를 불러올 수 없습니다.</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            {/* 학습 내용 탭 */}
            {learningError ? (
              <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 backdrop-blur-sm border border-slate-700/50">
                <CardContent className="py-10 text-center space-y-3">
                  <p className="text-sm text-destructive">{learningError}</p>
                  <Button variant="outline" onClick={fetchLearningContentData}>
                    다시 시도
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <LearningContentTabs
                learningContent={learningContent || undefined}
                loading={false}
              />
            )}
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
        }}
      />

      {/* 직접 학습 준비 모달 */}
      <DirectLearnModal
        open={directLearnModal.open}
        mode={directLearnModal.mode}
        preparing={directLearnModal.preparing}
        onClose={() => setDirectLearnModal({ open: false, mode: null, preparing: false, waitingForSession: false })}
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

function DirectLearnModal({
  open,
  mode,
  preparing,
  onClose,
}: {
  open: boolean;
  mode: "cloze" | "speaking" | "dictation" | null;
  preparing: boolean;
  onClose: () => void;
}) {
  const modeLabels = {
    cloze: "빈칸 퀴즈",
    speaking: "Speaking 연습",
    dictation: "딕테이션"
  };

  const modeIcons = {
    cloze: <CheckCircle className="h-8 w-8" />,
    speaking: <MicVocal className="h-8 w-8" />,
    dictation: <Keyboard className="h-8 w-8" />
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-['Pretendard'] font-bold text-xl">
            {mode ? modeLabels[mode] : "학습"} 준비
          </DialogTitle>
          <DialogDescription className="text-center font-['Pretendard']">
            {preparing ? "세션을 준비하고 있습니다..." : "준비가 완료되었습니다!"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8">
          <div className="mb-4 text-[#4B2199]">
            {mode && modeIcons[mode]}
          </div>

          {preparing ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4B2199]"></div>
              <span className="text-sm font-['Pretendard'] text-muted-foreground">
                세션 준비 중...
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <span className="text-sm font-['Pretendard'] font-medium">
                준비 완료! 곧 이동합니다...
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
