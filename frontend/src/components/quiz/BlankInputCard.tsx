/**
 * 빈칸 퀴즈 입력 카드(재사용 컴포넌트)
 * - 빈칸이 뚫린 문장 표시 + 입력창 + 제출 버튼
 * - Enter 제출이 가능하도록 <form>으로 구성
 * - 상태는 부모(페이지)에서 제어하는 controlled input 패턴
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type BlankInputCardProps = {
  /** 빈칸이 뚫린 문장 (예: "The club isn't the best place to find a ___") */
  sentence: string;
  /** 현재 입력값 (부모가 관리) */
  value: string;
  /** 입력값 변경 핸들러 */
  onChange: (next: string) => void;
  /** 제출 핸들러 (Enter / 버튼 클릭 시) */
  onSubmit: (value: string) => void;
  /** 채점/제출 중 UI 비활성화 */
  loading?: boolean;
  /** 입력 placeholder */
  placeholder?: string;
  /** 자동 포커스 여부 */
  autoFocus?: boolean;
  /** 추가 스타일 클래스 */
  className?: string;
};

export default function BlankInputCard({
  sentence,
  value,
  onChange,
  onSubmit,
  loading,
  placeholder = "정답을 입력하세요",
  autoFocus = true,
  className = "",
}: BlankInputCardProps) {
  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${className}`}>
      {/* 안내 타이틀 */}
      <h2 className="mb-2 text-center text-lg font-semibold">
        가사의 빈칸을 올바른 단어로 채워주세요
      </h2>

      {/* 문제 문장 */}
      <div className="mb-6 rounded-xl bg-muted p-6 text-center">
        {sentence || "문제를 불러오는 중..."}
      </div>

      {/* 입력 + 제출 (Enter로도 제출) */}
      <form
        className="flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(value.trim());
        }}
      >
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="정답 입력"
        />
        <Button type="submit" disabled={loading || !sentence}>
          정답 확인
        </Button>
      </form>
    </div>
  );
}
