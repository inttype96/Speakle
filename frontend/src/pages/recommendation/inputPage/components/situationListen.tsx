import React, { useState } from 'react';

// 상위 컴포넌트로부터 받을 props 타입 정의
interface SituationListenProps {
  onSituationChange: (situation: string) => void;  // 상황 선택 시 호출될 함수
  selectedSituation: string;  // 현재 선택된 상황
}

const SituationListen: React.FC<SituationListenProps> = ({ 
  onSituationChange, 
  selectedSituation 
}) => {
  // 로컬 상태는 제거하고 상위에서 관리되는 상태 사용
  // const [selectedSituations, setSelectedSituations] = useState<string[]>([]);

  const situations = [
    { id: 'morning', label: '아침 출근길', icon: '🌅' },
    { id: 'exercise', label: '운동할 때', icon: '🏋️' },
    { id: 'study', label: '공부할 때', icon: '📚' },
    { id: 'rest', label: '휴식할 때', icon: '😴' },
    { id: 'party', label: '파티/모임', icon: '🎉' },
    { id: 'travel', label: '여행 중', icon: '✈️' },
    { id: 'rainy', label: '비 오는 날', icon: '🌧️' },
    { id: 'sleep', label: '잠들기 전', icon: '🌙' }
  ];

  // 상황 선택 핸들러 - 상위 컴포넌트의 함수 호출
  const toggleSituation = (id: string) => {
    // 현재 선택된 상황과 같으면 선택 해제, 다르면 선택
    if (selectedSituation === id) {
      onSituationChange('');  // 선택 해제
    } else {
      onSituationChange(id);  // 새로운 상황 선택
    }
  };

  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-foreground mb-6">어떤 상황에서 듣고 싶으신가요?</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {situations.map((situation) => (
          <button
            key={situation.id}
            onClick={() => toggleSituation(situation.id)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedSituation === situation.id
                ? 'border-primary bg-primary/10 text-primary-foreground shadow-md'
                : 'border-border bg-card text-card-foreground hover:border-primary/30 hover:bg-muted/50'
            }`}
          >
            <div className="text-3xl mb-2">{situation.icon}</div>
            <div className="text-sm font-medium">{situation.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SituationListen;
