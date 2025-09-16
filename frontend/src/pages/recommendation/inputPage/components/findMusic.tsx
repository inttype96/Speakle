import React from 'react';

const FindMusic: React.FC = () => {
  return (
    <div className="text-center py-12">
      {/* Speakle 로고 */}
      <div className="mb-8">
        <h1 className="text-6xl font-bold text-foreground mb-4">Speakle</h1>
        <h2 className="text-4xl font-bold text-foreground mb-6">나만의 음악 찾기</h2>
        <p className="text-lg text-muted-foreground mx-auto leading-relaxed">
          현재 상황이나 선호하는 장르를 선택하면 당신에게 맞는 곡을 추천해드립니다.<br />
          선택한 곡으로 영어 학습을 시작해보세요!
        </p>
      </div>
    </div>
  );
};

export default FindMusic;