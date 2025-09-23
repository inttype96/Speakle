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
  { value: "work", label: "직장", icon: Briefcase },
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
];

const LOCATIONS: Option[] = [
  { value: "home", label: "집", icon: Home },
  { value: "car", label: "차 안", icon: Car },
  { value: "gym", label: "헬스장", icon: Dumbbell },
  { value: "office", label: "사무실", icon: Building2 },
  { value: "cafe", label: "카페", icon: Coffee },
  { value: "school", label: "학교", icon: GraduationCap },
  { value: "library", label: "도서관", icon: Library },
];

const MORE_LOCATIONS: Option[] = [
  { value: "outdoor", label: "야외/산책", icon: Mountain },
  { value: "park", label: "공원", icon: Mountain },
  { value: "beach", label: "해변", icon: Plane },
  { value: "restaurant", label: "식당", icon: Music2 },
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
    <div className="bg-background text-foreground">
        {/* Navbar + 스페이서 */}
        <Navbar />
        <div aria-hidden className="h-16 md:h-20" />

      {/* 헤드셋 로고 */}
      <div className="flex justify-center mt-8 mb-1">
        <div className="relative">
          <img
            src={HeadphoneImage}
            alt="Headset"
            className="w-44 h-44 object-contain"
          />
          <h1 className="absolute inset-0 flex items-center justify-center text-4xl font-extrabold font-poppins">
            Speakle
          </h1>
        </div>
      </div>

      {/* 상단 헤더 */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">나만의 음악 찾기</h1>
        <p className="text-muted-foreground">
          영어를 배우고 싶은 상황과 장소를 선택하면 당신에게 맞춘 곡을 추천해드려요.
        </p>
      </div>

      {/* 상황 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">어떤 상황에서 사용할 표현을 팝송으로 배우고 싶으신가요?</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={situation}
            onValueChange={(v) => {
              if (v) {
                setSituation(v);
                setCustomSituation("");
              }
            }}
            className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
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
                "h-20 justify-center rounded-xl border bg-card text-card-foreground",
                "hover:bg-[#B5A6E0] hover:text-black px-4 py-3 flex items-center gap-2"
              )}
            >
              <Plus className="size-5" />
              <span className="font-medium">{showMoreSituations ? "간단히 보기" : "더보기"}</span>
            </button>
          </ToggleGroup>

          {showMoreSituations && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Edit3 className="size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="직접 입력하기 (예: 데이트, 집들이 등)"
                  value={customSituation}
                  onChange={(e) => {
                    setCustomSituation(e.target.value);
                    if (e.target.value) setSituation("");
                  }}
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B2199] focus-visible:ring-offset-2"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 장소 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">어떤 장소에서 사용할 표현을 팝송으로 배우고 싶으신가요?</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={location}
            onValueChange={(v) => {
              if (v) {
                setLocation(v);
                setCustomLocation("");
              }
            }}
            className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
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
                "h-20 justify-center rounded-xl border bg-card text-card-foreground",
                "hover:bg-[#B5A6E0] hover:text-black px-4 py-3 flex items-center gap-2"
              )}
            >
              <Plus className="size-5" />
              <span className="font-medium">{showMoreLocations ? "간단히 보기" : "더보기"}</span>
            </button>
          </ToggleGroup>

          {showMoreLocations && (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <Edit3 className="size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="직접 입력하기 (예: 놀이공원, 영화관 등)"
                  value={customLocation}
                  onChange={(e) => {
                    setCustomLocation(e.target.value);
                    if (e.target.value) setLocation("");
                  }}
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B2199] focus-visible:ring-offset-2"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 추천 버튼 */}
      <div className="flex justify-center">
        <Button size="lg" className="px-6" onClick={handleRecommend} disabled={!canRecommend}>
          추천 받고 영어 학습 시작하기
        </Button>
      </div>

      {/* 하단 안내 */}
      <div className="mt-8 text-sm text-muted-foreground">
        <Card>
          <CardContent className="space-y-1 py-4">
            <p>• 상황, 장소 하나 이상을 선택할수록 추천 정확도가 높아집니다.</p>
            <p>• 추천은 선택된 키워드를 바탕으로 영어 학습에 적합한 곡을 우선 제공합니다.</p>
          </CardContent>
        </Card>
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
        "h-20 justify-start rounded-xl border bg-card text-card-foreground",
        "data-[state=on]:bg-[#4B2199] data-[state=on]:text-white data-[state=on]:border-[#4B2199]",
        "hover:bg-[#B5A6E0] hover:text-black px-4 py-3 text-left"
      )}
    >
      <div className="flex items-center gap-3">
        {Icon ? <Icon className="size-5 shrink-0" /> : null}
        <div className="font-medium">{option.label}</div>
      </div>
    </ToggleGroupItem>
  );
}
