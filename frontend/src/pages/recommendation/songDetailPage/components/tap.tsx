import React, { useState } from 'react';

const Tap: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lyrics' | 'vocabulary' | 'grammar'>('lyrics');

  const tabs = [
    { id: 'lyrics' as const, label: '가사', icon: '🎵' },
    { id: 'vocabulary' as const, label: '단어', icon: '📚' },
    { id: 'grammar' as const, label: '문법', icon: '📝' }
  ];

  return (
    <div className="tap bg-background border-t border-border">
      <div className="max-w-6xl mx-auto px-4">
        {/* 탭 네비게이션 */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="py-8">
          {activeTab === 'lyrics' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">가사 보기</h3>
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <span className="text-sm text-muted-foreground font-mono">1</span>
                    <div className="flex-1">
                      <p className="text-foreground">I'm in love with the shape of you</p>
                      <p className="text-muted-foreground text-sm mt-1">당신의 모습에 사랑에 빠졌어요</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-sm text-muted-foreground font-mono">2</span>
                    <div className="flex-1">
                      <p className="text-foreground">We push and pull like a magnet do</p>
                      <p className="text-muted-foreground text-sm mt-1">우리는 자석처럼 밀고 당기죠</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-sm text-muted-foreground font-mono">3</span>
                    <div className="flex-1">
                      <p className="text-foreground">Although my heart is falling too</p>
                      <p className="text-muted-foreground text-sm mt-1">비록 내 마음도 떨어지고 있지만</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vocabulary' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">중요 단어</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { word: 'shape', meaning: '모습, 형태', example: 'the shape of you' },
                  { word: 'magnet', meaning: '자석', example: 'like a magnet do' },
                  { word: 'push', meaning: '밀다', example: 'we push and pull' },
                  { word: 'pull', meaning: '당기다', example: 'we push and pull' },
                  { word: 'although', meaning: '비록 ~이지만', example: 'although my heart' },
                  { word: 'falling', meaning: '떨어지는', example: 'heart is falling' }
                ].map((vocab, index) => (
                  <div key={index} className="bg-card border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-card-foreground">{vocab.word}</h4>
                      <button className="text-primary hover:text-primary/80">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">{vocab.meaning}</p>
                    <p className="text-xs text-muted-foreground/70 italic">"{vocab.example}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'grammar' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">문법 포인트</h3>
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h4 className="font-semibold text-card-foreground mb-3">1. "be in love with" 구문</h4>
                  <p className="text-muted-foreground mb-3">~에 사랑에 빠져있다는 의미</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-foreground font-mono">I'm in love with the shape of you</p>
                    <p className="text-muted-foreground text-sm mt-1">당신의 모습에 사랑에 빠졌어요</p>
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-6">
                  <h4 className="font-semibold text-card-foreground mb-3">2. "like" 비교 표현</h4>
                  <p className="text-muted-foreground mb-3">~처럼 이라는 의미로 비교할 때 사용</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-foreground font-mono">like a magnet do</p>
                    <p className="text-muted-foreground text-sm mt-1">자석처럼</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tap;
