"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Navbar from "@/components/common/navbar";

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
  TentTree,
  Building2,
  GraduationCap,
  Library,
  Landmark,
  Mountain,
} from "lucide-react";

type Option = { value: string; label: string; icon?: React.ComponentType<any> };

const SITUATIONS: Option[] = [
  { value: "morning_routine", label: "아침 루틴", icon: Coffee },
  { value: "workout", label: "운동할 때", icon: Dumbbell },
  { value: "commute", label: "출퇴근 때", icon: Briefcase },
  { value: "meal", label: "음식/식사", icon: Music2 },
  { value: "party", label: "파티/모임", icon: PartyPopper },
  { value: "travel", label: "여행 중", icon: Plane },
  { value: "rainy", label: "비 오는 날", icon: CloudRain },
  { value: "night", label: "밤/힐링", icon: Moon },
];

const LOCATIONS: Option[] = [
  { value: "home", label: "집", icon: Home },
  { value: "car", label: "차 안", icon: Car },
  { value: "gym", label: "헬스장", icon: Dumbbell },
  { value: "office", label: "사무실", icon: Building2 },
  { value: "cafe", label: "카페", icon: Coffee },
  { value: "school", label: "학교", icon: GraduationCap },
  { value: "library", label: "도서관", icon: Library },
  { value: "outdoor", label: "야외/산책", icon: Mountain },
];

const GENRES: string[] = [
  "Pop",
  "K-Pop",
  "Rock",
  "Hip-Hop",
  "R&B",
  "Electronic",
  "Indie",
  "Ballad",
  "Jazz",
  "Country",
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [situation, setSituation] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [genres, setGenres] = useState<string[]>([]);

  const canRecommend = useMemo(
    () => !!situation && !!location && genres.length > 0,
    [situation, location, genres]
  );

  const handleRecommend = () => {
    const params = new URLSearchParams();
    params.set("situation", situation);
    params.set("location", location);
    params.set("genre", genres.join(",")); // 다중 선택 → 콤마로 직렬화
    navigate(`/recommendations?${params.toString()}`);
  };

  return (
    <div className="bg-background text-foreground">
        {/* Navbar + 스페이서 */}
        <Navbar />
      <div aria-hidden className="h-16 md:h-20" />    
      {/* 상단 헤더 */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">나만의 음악 찾기</h1>
        <p className="text-muted-foreground">
          상황과 장소, 그리고 선호하는 장르를 선택하면 당신에게 맞춘 곡을 추천해드려요.
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
            onValueChange={(v) => v && setSituation(v)}
            className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {SITUATIONS.map((opt) => (
              <ToggleTile key={opt.value} option={opt} selected={situation === opt.value} />
            ))}
          </ToggleGroup>
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
            onValueChange={(v) => v && setLocation(v)}
            className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {LOCATIONS.map((opt) => (
              <ToggleTile key={opt.value} option={opt} selected={location === opt.value} />
            ))}
          </ToggleGroup>
        </CardContent>
      </Card>

      {/* 장르 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">선호하는 장르를 선택해주세요.</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => {
              const active = genres.includes(g);
              return (
                <Badge
                  key={g}
                  variant={active ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer text-sm px-3 py-1 rounded-full",
                    active && "ring-2 ring-primary/30"
                  )}
                  onClick={() =>
                    setGenres((prev) =>
                      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
                    )
                  }
                >
                  {g}
                </Badge>
              );
            })}
          </div>

          <Separator />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>선택된 장르</span>
            <span>{genres.length ? genres.join(" · ") : "없음"}</span>
          </div>
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
            <p>• 상황, 장소, 장르 중 하나 이상을 선택할수록 추천 정확도가 높아집니다.</p>
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
  selected,
}: {
  option: Option;
  selected: boolean;
}) {
  const Icon = option.icon;
  return (
    <ToggleGroupItem
      value={option.value}
      aria-label={option.label}
      className={cn(
        "h-20 justify-start rounded-xl border bg-card text-card-foreground",
        "data-[state=on]:border-primary data-[state=on]:ring-2 data-[state=on]:ring-primary/30",
        "hover:bg-accent hover:text-accent-foreground px-4 py-3 text-left"
      )}
    >
      <div className="flex items-center gap-3">
        {Icon ? <Icon className="size-5 shrink-0" /> : null}
        <div className="font-medium">{option.label}</div>
      </div>
    </ToggleGroupItem>
  );
}
