import React, { useEffect } from 'react';

const ResultList: React.FC = () => {
  useEffect(() => {
    // 스크롤바 숨기기
    const style = document.createElement('style');
    style.textContent = `
      .songlist::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  // 테스트용 곡 데이터
  const songs = [
    { id: 1, title: 'Shape of You', artist: 'Ed Sheeran', album: '÷ (Divide)', duration: '3:53', genre: 'Pop' },
    { id: 2, title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', genre: 'Synth-pop' },
    { id: 3, title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', duration: '3:23', genre: 'Disco-pop' },
    { id: 4, title: 'Watermelon Sugar', artist: 'Harry Styles', album: 'Fine Line', duration: '2:54', genre: 'Pop Rock' },
    { id: 5, title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR', duration: '2:58', genre: 'Pop Punk' },
    { id: 6, title: 'Stay', artist: 'The Kid LAROI, Justin Bieber', album: 'F*CK LOVE 3', duration: '2:21', genre: 'Pop' },
    { id: 7, title: 'Industry Baby', artist: 'Lil Nas X, Jack Harlow', album: 'MONTERO', duration: '3:32', genre: 'Hip-Hop' },
    { id: 8, title: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland', duration: '3:58', genre: 'Indie Pop' }
  ];

  return (
    <div className="result border border-gray-500 rounded-lg p-4 mb-8 flex h-96 w-full max-w-none">
        <div className="first w-1/3 pr-4">
            <h2 className="text-2xl font-bold text-foreground mb-6">상위 결과</h2>
            <div className="bg-card border border-border rounded-lg p-4 h-72">
                {/* 앨범 표지 */}
                <div className="flex justify-start mb-4">
                    <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-muted-foreground text-2xl">♪</span>
                    </div>
                </div>
                
                {/* 곡 정보 */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-card-foreground">Shape of You</h3>
                    <p className="text-muted-foreground text-sm">Ed Sheeran</p>
                    <p className="text-muted-foreground/70 text-xs">÷ (Divide)</p>
                </div>
            </div>
        </div>

        <div className="second w-2/3 pl-4">
            <h2 className="text-2xl font-bold text-foreground mb-6">곡</h2>
            <div 
              className="songlist space-y-4 h-72 overflow-y-auto pr-2"
              style={{
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}
            >
                {songs.map((song) => (
                <div key={song.id} className="bg-card border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors shadow-sm">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">♪</span>
                </div>
                <div>
                  <h3 className="text-card-foreground font-semibold">{song.title}</h3>
                  <p className="text-muted-foreground text-sm">{song.artist}</p>
                  <p className="text-muted-foreground/70 text-xs">{song.album}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground text-sm">{song.genre}</span>
                <span className="text-muted-foreground text-sm">{song.duration}</span>
                <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm transition-colors">
                        듣기
                        </button>
                    </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default ResultList;
