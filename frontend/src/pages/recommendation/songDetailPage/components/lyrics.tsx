import React, { useState } from 'react';

const Lyrics: React.FC = () => {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const lyricsData = [
    {
      id: 1,
      english: "I'm in love with the shape of you",
      korean: "당신의 모습에 사랑에 빠졌어요",
      time: "0:00"
    },
    {
      id: 2,
      english: "We push and pull like a magnet do",
      korean: "우리는 자석처럼 밀고 당기죠",
      time: "0:15"
    },
    {
      id: 3,
      english: "Although my heart is falling too",
      korean: "비록 내 마음도 떨어지고 있지만",
      time: "0:30"
    },
    {
      id: 4,
      english: "I'm in love with your body",
      korean: "당신의 몸에 사랑에 빠졌어요",
      time: "0:45"
    },
    {
      id: 5,
      english: "And last night you were in my room",
      korean: "그리고 어젯밤 당신은 내 방에 있었어요",
      time: "1:00"
    },
    {
      id: 6,
      english: "And now my bedsheets smell like you",
      korean: "그리고 이제 내 침대 시트는 당신 냄새가 나요",
      time: "1:15"
    }
  ];

  return (
    <div className="lyrics bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 재생 컨트롤 */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-card-foreground">Shape of You</h2>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full font-semibold transition-colors"
            >
              {isPlaying ? '⏸ 일시정지' : '▶ 재생'}
            </button>
          </div>
          
          {/* 진행 바 */}
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div className="bg-primary h-2 rounded-full" style={{ width: '30%' }}></div>
          </div>
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>0:30</span>
            <span>3:53</span>
          </div>
        </div>

        {/* 가사 리스트 */}
        <div className="space-y-4">
          {lyricsData.map((line) => (
            <div
              key={line.id}
              onClick={() => setSelectedLine(selectedLine === line.id ? null : line.id)}
              className={`bg-card border rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                selectedLine === line.id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/30 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    selectedLine === line.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {line.id}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-muted-foreground font-mono">{line.time}</span>
                    {selectedLine === line.id && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        현재 재생 중
                      </span>
                    )}
                  </div>
                  
                  <p className="text-lg text-foreground mb-2 font-medium">
                    {line.english}
                  </p>
                  
                  <p className="text-muted-foreground">
                    {line.korean}
                  </p>
                  
                  {selectedLine === line.id && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold text-card-foreground mb-2">학습 포인트</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• "be in love with" - ~에 사랑에 빠져있다</li>
                        <li>• "push and pull" - 밀고 당기다</li>
                        <li>• "like a magnet" - 자석처럼</li>
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 학습 완료 버튼 */}
        <div className="mt-12 text-center">
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full text-lg font-semibold transition-colors shadow-lg">
            학습 완료하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lyrics;
