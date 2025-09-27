"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, MessageSquare, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LearningContent, WordEntity, SentenceEntity, ExpressionEntity, IdiomEntity } from "@/types/song";

interface LearningContentTabsProps {
  learningContent?: LearningContent;
  loading?: boolean;
}

type LearningSection = "words" | "sentences" | "expressions" | "idioms";

const SECTIONS: {
  key: LearningSection;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}[] = [
  {
    key: "words",
    label: "단어",
    icon: BookOpen,
    description: "핵심 어휘와 뜻",
    color: "text-blue-600 dark:text-blue-400"
  },
  {
    key: "sentences",
    label: "문장",
    icon: MessageSquare,
    description: "중요한 문장 구조",
    color: "text-green-600 dark:text-green-400"
  },
  {
    key: "expressions",
    label: "표현",
    icon: Lightbulb,
    description: "자주 쓰이는 표현들",
    color: "text-orange-600 dark:text-orange-400"
  },
  {
    key: "idioms",
    label: "관용구",
    icon: Sparkles,
    description: "숙어와 관용 표현",
    color: "text-purple-600 dark:text-purple-400"
  }
];

export default function LearningContentTabs({ learningContent }: LearningContentTabsProps) {
  const [currentSection, setCurrentSection] = useState<LearningSection>("words");

  const getCurrentData = (): (WordEntity | SentenceEntity | ExpressionEntity | IdiomEntity)[] => {
    if (!learningContent) return [];
    const sectionData = learningContent[currentSection];
    if (!sectionData || !Array.isArray(sectionData)) return [];
    return sectionData;
  };

  const currentData = getCurrentData();
  const hasData = currentData.length > 0;

  const renderEntityItem = (item: WordEntity | SentenceEntity | ExpressionEntity | IdiomEntity, index: number) => {
    const getDisplayText = () => {
      switch (currentSection) {
        case "words":
          const word = item as WordEntity;
          return {
            main: word.word,
            sub: word.meaning,
            extra: word.phonetic ? `[${word.phonetic}]` : word.pos || '',
            examples: word.examples || []
          };
        case "sentences":
          const sentence = item as SentenceEntity;
          return {
            main: sentence.sentence,
            sub: sentence.translation || sentence.meaning,
            extra: sentence.pattern || '',
            examples: sentence.examples || []
          };
        case "expressions":
          const expression = item as ExpressionEntity;
          return {
            main: expression.expression,
            sub: expression.meaning,
            extra: expression.usage || '',
            examples: expression.examples || []
          };
        case "idioms":
          const idiom = item as IdiomEntity;
          return {
            main: idiom.idiom,
            sub: idiom.meaning,
            extra: idiom.origin || '',
            examples: idiom.examples || []
          };
        default:
          return { main: '', sub: '', extra: '', examples: [] };
      }
    };

    const { main, sub, extra, examples } = getDisplayText();

    return (
      <div
        key={item.id}
        className="p-3 rounded-xl backdrop-blur-sm bg-slate-800/40 border border-slate-600/50 hover:bg-slate-700/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden', wordBreak: 'break-word' }}
      >
        <div className="flex items-start gap-3">
          <Badge className="mt-1 text-xs min-w-[20px] h-5 justify-center shrink-0 bg-[#4B2199] text-white hover:bg-[#B5A6E0] hover:text-black transition-colors duration-200 font-['Pretendard'] font-medium">
            {index + 1}
          </Badge>
          <div className="flex-1 min-w-0 space-y-2" style={{ maxWidth: '100%', overflow: 'hidden', wordBreak: 'break-word' }}>
            <div className="space-y-1">
              <p className="font-medium text-sm leading-relaxed break-words font-['Pretendard'] text-white max-w-full overflow-hidden">{main}</p>
              <p className="text-sm text-white/70 leading-relaxed break-words font-['Pretendard'] max-w-full overflow-hidden">{sub}</p>
              {extra && (
                <p className="text-xs text-white/50 leading-relaxed break-words font-['Pretendard']">{extra}</p>
              )}
            </div>
            {Array.isArray(examples) && examples.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-white/60 font-['Pretendard']">예시:</p>
                <div className="space-y-1">
                  {examples.slice(0, 2).map((example, idx) => (
                    <p key={idx} className="text-xs text-white/50 italic leading-relaxed break-words font-['Pretendard']">
                      • {example}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5" style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflow: 'hidden' }}>
      {/* Google Fonts Link */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      {/* 탭 버튼들 */}
      <div className="flex gap-2 flex-wrap">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = currentSection === section.key;

          return (
            <Button
              key={section.key}
              onClick={() => setCurrentSection(section.key)}
              className={cn(
                "flex items-center gap-2 transition-all duration-300 font-['Pretendard'] font-medium text-sm px-4 py-2 rounded-xl backdrop-blur-sm border",
                isActive
                  ? "bg-[#4B2199] text-white border-[#4B2199] shadow-lg hover:bg-[#5A2BB8] hover:shadow-xl"
                  : "bg-white/10 text-white border-white/30 hover:bg-[#B5A6E0] hover:text-black hover:border-[#B5A6E0] hover:scale-105"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {section.label}
              {learningContent?.[section.key] && Array.isArray(learningContent[section.key]) && (
                <Badge
                  className={cn(
                    "ml-1 text-xs px-1.5 py-0.5 rounded-md font-['Pretendard'] font-medium transition-colors duration-200",
                    isActive
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "bg-white/20 text-white hover:bg-black/20"
                  )}
                >
                  {learningContent[section.key].length}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* 컨텐츠 영역 */}
      <Card className="min-h-[350px] backdrop-blur-sm bg-gradient-to-br from-slate-900/70 to-slate-800/50 border border-slate-700/60 shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="pt-5">
          {hasData ? (
            <ScrollArea className="h-[350px] pr-2">
              <div className="space-y-2 w-full" style={{ maxWidth: '100%', width: '100%' }}>
                {currentData.map((item, index) => renderEntityItem(item, index))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-[350px] text-center space-y-3">
              <div className="w-14 h-14 backdrop-blur-sm bg-slate-800/60 rounded-full flex items-center justify-center border border-slate-600/50">
                {(() => {
                  const section = SECTIONS.find(s => s.key === currentSection);
                  const Icon = section?.icon || BookOpen;
                  return <Icon className="h-7 w-7 text-white/60" />;
                })()}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-white/80 font-['Pretendard']">
                  {SECTIONS.find(s => s.key === currentSection)?.label} 데이터가 없습니다
                </p>
                <p className="text-xs text-white/60 font-['Pretendard'] max-w-sm">
                  이 곡에는 {SECTIONS.find(s => s.key === currentSection)?.label} 학습 내용이 아직 준비되지 않았어요
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}