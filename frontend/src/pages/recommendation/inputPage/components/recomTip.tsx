import React from 'react';

const RecomTip: React.FC = () => {
  const tips = [
    '상황, 장소, 장르 중 하나 이상을 선택하면 맞춤 곡을 추천받을 수 있어요',
    '각 조건별로 해당 분위기에 맞는 곡들을 우선적으로 보여드려요',
    '추천받은 곡은 플레이리스트에 저장하여 나중에 다시 학습할 수 있어요',
    '학습 난이도는 곡의 가사 복잡도와 속도를 기반으로 결정됩니다'
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
      <h3 className="text-2xl font-bold text-card-foreground mb-6">추천 팁</h3>
      <ul className="space-y-3">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start text-muted-foreground">
            <span className="text-primary mr-3 font-bold">•</span>
            <span className="text-sm leading-relaxed">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecomTip;
