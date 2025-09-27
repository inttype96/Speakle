"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import Navbar from "@/components/common/navbar";
import HeadphoneImage from '@/assets/images/headset2.png';

// lucide 아이콘 (필요에 따라 더 추가 가능)
import {
  Coffee,
  Dumbbell,
  Briefcase,
  Music2,
  PartyPopper,
  Plane,
  CloudRain,
  Moon,
  Home,
  Car,
  Building2,
  GraduationCap,
  Library,
  Mountain,
  Plus,
  Heart,
  Smile,
  Frown,
  Sun,
  Edit3,
} from "lucide-react";

type Option = { value: string; label: string; icon?: React.ComponentType<any> };

const SITUATIONS: Option[] = [
  { value: "workout", label: "운동할 때", icon: Dumbbell },
  { value: "meal", label: "음식/식사", icon: Music2 },
  { value: "party", label: "파티/모임", icon: PartyPopper },
  { value: "travel", label: "여행 중", icon: Plane },
  { value: "night", label: "밤/힐링", icon: Moon },
  { value: "love", label: "연애/사랑", icon: Heart },
  { value: "work", label: "업무", icon: Briefcase },
];

const MORE_SITUATIONS: Option[] = [
  { value: "morning_routine", label: "아침 루틴", icon: Coffee },
  { value: "commute", label: "출퇴근 때", icon: Car },
  { value: "rainy", label: "비 오는 날", icon: CloudRain },
  { value: "happy", label: "기분 좋을 때", icon: Smile },
  { value: "sad", label: "우울할 때", icon: Frown },
  { value: "relaxing", label: "휴식/쉬는 시간", icon: Coffee },
  { value: "study", label: "공부할 때", icon: GraduationCap },
  { value: "cleaning", label: "청소/집안일", icon: Home },
  { value: "driving", label: "운전 중", icon: Car },
  { value: "sunny", label: "화창한 날", icon: Sun },
  { value: "icebreaking", label: "아이스브레이킹", icon: Smile },
  { value: "christmas", label: "크리스마스", icon: PartyPopper },

];

const LOCATIONS: Option[] = [
  { value: "home", label: "집", icon: Home },
  { value: "car", label: "차 안", icon: Car },
  { value: "restaurant", label: "식당", icon: Music2 },
  { value: "gym", label: "헬스장", icon: Dumbbell },
  { value: "office", label: "사무실", icon: Building2 },
  { value: "school", label: "학교", icon: GraduationCap },
  { value: "library", label: "도서관", icon: Library },
];

const MORE_LOCATIONS: Option[] = [
  { value: "outdoor", label: "야외/산책", icon: Mountain },
  { value: "park", label: "공원", icon: Mountain },
  { value: "beach", label: "해변", icon: Plane },
  { value: "cafe", label: "카페", icon: Coffee },
  { value: "subway", label: "지하철", icon: Car },
  { value: "bus", label: "버스", icon: Car },
  { value: "airport", label: "공항", icon: Plane },
  { value: "hotel", label: "호텔", icon: Building2 },
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [situation, setSituation] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [showMoreSituations, setShowMoreSituations] = useState<boolean>(false);
  const [showMoreLocations, setShowMoreLocations] = useState<boolean>(false);
  const [customSituation, setCustomSituation] = useState<string>("");
  const [customLocation, setCustomLocation] = useState<string>("");

  const canRecommend = useMemo(
    () => (!!situation || !!customSituation) && (!!location || !!customLocation),
    [situation, location, customSituation, customLocation]
  );

  const handleRecommend = () => {
    const params = new URLSearchParams();
    const finalSituation = customSituation || situation;
    const finalLocation = customLocation || location;
    params.set("situation", finalSituation);
    params.set("location", finalLocation);
    navigate(`/recommendations?${params.toString()}`);
  };

  return (
    <div className="bg-background text-foreground font-sans">
        {/* Google Fonts Link */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Navbar + 스페이서 */}
        <Navbar />
        <div aria-hidden className="h-16 md:h-20" />

      {/* 헤드셋 로고 */}
      <div className="flex justify-center mt-12 mb-8">
        <div className="relative group">
          <img
            src={HeadphoneImage}
            alt="Headset"
            className="w-56 h-56 object-contain transition-all duration-500 group-hover:scale-105 filter drop-shadow-2xl"
          />
          <h1 className="absolute inset-0 flex items-center justify-center text-5xl font-black font-['Inter'] transition-all duration-300 group-hover:text-purple-600">
            Speakle
          </h1>
        </div>
      </div>

      {/* 상단 헤더 */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold tracking-tight font-['Pretendard'] text-white">
          나만의 음악 찾기
        </h1>
        <p className="text-lg text-muted-foreground font-['Pretendard'] font-medium max-w-2xl mx-auto leading-relaxed">
          영어를 배우고 싶은 상황과 장소를 선택하면 당신에게 맞춘 곡을 추천해드려요.
        </p>
      </div>

      {/* 상황 */}
      <div className="max-w-6xl mx-auto px-4">
        <Card className="mb-8 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-['Pretendard'] font-bold text-center">어떤 상황에서 사용할 표현을 팝송으로 배우고 싶으신가요?</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ToggleGroup
              type="single"
              value={situation}
              onValueChange={(v) => {
                if (v) {
                  setSituation(v);
                  setCustomSituation("");
                }
              }}
              className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
            {SITUATIONS.map((opt) => (
              <ToggleTile key={opt.value} option={opt} />
            ))}
            {showMoreSituations && MORE_SITUATIONS.map((opt) => (
              <ToggleTile key={opt.value} option={opt} />
            ))}
            <button
              onClick={() => setShowMoreSituations(!showMoreSituations)}
              className={cn(
                "h-24 justify-center rounded-2xl backdrop-blur-sm bg-white/20 border border-white/30",
                "hover:bg-[#B5A6E0] hover:text-black hover:border-[#B5A6E0]",
                "px-6 py-4 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              )}
            >
              <Plus className="size-5" />
              <span className="font-medium font-['Pretendard']">{showMoreSituations ? "간단히 보기" : "더보기"}</span>
            </button>
          </ToggleGroup>

            {showMoreSituations && (
              <div className="mt-6 col-span-full">
                <div className="flex items-center gap-3 backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Edit3 className="size-5 text-purple-400" />
                  <input
                    type="text"
                    placeholder="직접 입력하기 (예: 데이트, 집들이 등)"
                    value={customSituation}
                    onChange={(e) => {
                      setCustomSituation(e.target.value);
                      if (e.target.value) setSituation("");
                    }}
                    className="flex-1 h-12 rounded-xl border-0 bg-white/20 backdrop-blur-sm px-4 py-3 text-base font-['Pretendard'] font-medium placeholder:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 focus-visible:bg-white/30 transition-all duration-300"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 장소 */}
        <Card className="mb-8 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-['Pretendard'] font-bold text-center">어떤 장소에서 사용할 표현을 팝송으로 배우고 싶으신가요?</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ToggleGroup
              type="single"
              value={location}
              onValueChange={(v) => {
                if (v) {
                  setLocation(v);
                  setCustomLocation("");
                }
              }}
              className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {LOCATIONS.map((opt) => (
              <ToggleTile key={opt.value} option={opt} />
            ))}
            {showMoreLocations && MORE_LOCATIONS.map((opt) => (
              <ToggleTile key={opt.value} option={opt} />
            ))}
            <button
              onClick={() => setShowMoreLocations(!showMoreLocations)}
              className={cn(
                "h-24 justify-center rounded-2xl backdrop-blur-sm bg-white/20 border border-white/30",
                "hover:bg-[#B5A6E0] hover:text-black hover:border-[#B5A6E0]",
                "px-6 py-4 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              )}
            >
              <Plus className="size-5" />
              <span className="font-medium font-['Pretendard']">{showMoreLocations ? "간단히 보기" : "더보기"}</span>
            </button>
          </ToggleGroup>

            {showMoreLocations && (
              <div className="mt-6 col-span-full">
                <div className="flex items-center gap-3 backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Edit3 className="size-5 text-purple-400" />
                  <input
                    type="text"
                    placeholder="직접 입력하기 (예: 놀이공원, 영화관 등)"
                    value={customLocation}
                    onChange={(e) => {
                      setCustomLocation(e.target.value);
                      if (e.target.value) setLocation("");
                    }}
                    className="flex-1 h-12 rounded-xl border-0 bg-white/20 backdrop-blur-sm px-4 py-3 text-base font-['Pretendard'] font-medium placeholder:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 focus-visible:bg-white/30 transition-all duration-300"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 추천 버튼 */}
        <div className="flex justify-center mb-8">
          <Button
            size="lg"
            className="px-12 py-4 text-lg font-['Pretendard'] font-bold bg-[#4B2199] hover:bg-[#5A2BB8] text-white border border-[#B5A6E0]/30 hover:border-[#B5A6E0] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={handleRecommend}
            disabled={!canRecommend}
          >
             추천 받고 영어 학습 시작하기
          </Button>
        </div>

        {/* 하단 안내 */}
        <div className="text-sm text-muted-foreground">
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10">
            <CardContent className="space-y-2 py-6 font-['Pretendard'] font-medium text-center">
              <p className="flex items-center justify-center gap-2">💡 상황, 장소 하나 이상을 선택할수록 추천 정확도가 높아집니다.</p>
              <p className="flex items-center justify-center gap-2">  추천은 선택된 키워드를 바탕으로 영어 학습에 적합한 곡을 우선 제공합니다.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** 카드처럼 보이는 ToggleGroupItem */
function ToggleTile({
  option,
}: {
  option: Option;
}) {
  const Icon = option.icon;
  return (
    <ToggleGroupItem
      value={option.value}
      aria-label={option.label}
      className={cn(
        "h-24 justify-start rounded-2xl backdrop-blur-sm bg-white/20 border border-white/30 text-foreground",
        "data-[state=on]:bg-[#4B2199] data-[state=on]:text-white data-[state=on]:border-[#4B2199] data-[state=on]:shadow-xl",
        "hover:bg-[#B5A6E0] hover:text-black hover:border-[#B5A6E0]",
        "px-6 py-4 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg"
      )}
    >
      <div className="flex items-center gap-4">
        {Icon ? <Icon className="size-6 shrink-0" /> : null}
        <div className="font-semibold text-base font-['Pretendard']">{option.label}</div>
      </div>
    </ToggleGroupItem>
  );
}
