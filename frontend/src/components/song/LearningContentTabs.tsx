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
    return learningContent[currentSection] || [];
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
            sub: sentence.meaning,
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
        className="p-4 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/80 transition-colors"
      >
        <div className="flex items-start gap-3">
          <Badge variant="secondary" className="mt-1 text-xs min-w-[24px] h-6 justify-center shrink-0">
            {index + 1}
          </Badge>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="space-y-1">
              <p className="font-medium text-sm leading-relaxed break-words">{main}</p>
              <p className="text-sm text-muted-foreground leading-relaxed break-words">{sub}</p>
              {extra && (
                <p className="text-xs text-muted-foreground leading-relaxed break-words">{extra}</p>
              )}
            </div>
            {examples.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">예시:</p>
                <div className="space-y-1">
                  {examples.slice(0, 2).map((example, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground italic leading-relaxed break-words">
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
    <div className="space-y-6">
      {/* 탭 버튼들 */}
      <div className="flex gap-3 flex-wrap">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = currentSection === section.key;

          return (
            <Button
              key={section.key}
              onClick={() => setCurrentSection(section.key)}
              variant={isActive ? "default" : "outline"}
              className={cn(
                "flex items-center gap-2 transition-all",
                isActive ? "shadow-md" : "hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              {section.label}
              {learningContent?.[section.key] && (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="ml-1"
                >
                  {learningContent[section.key].length}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* 컨텐츠 영역 */}
      <Card className="min-h-[400px]">
        <CardContent className="pt-6">
          {hasData ? (
            <ScrollArea className="h-[400px] pr-3">
              <div className="space-y-3">
                {currentData.map((item, index) => renderEntityItem(item, index))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-3">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                {(() => {
                  const section = SECTIONS.find(s => s.key === currentSection);
                  const Icon = section?.icon || BookOpen;
                  return <Icon className="h-8 w-8 text-muted-foreground" />;
                })()}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {SECTIONS.find(s => s.key === currentSection)?.label} 데이터가 없습니다
                </p>
                <p className="text-xs text-muted-foreground">
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