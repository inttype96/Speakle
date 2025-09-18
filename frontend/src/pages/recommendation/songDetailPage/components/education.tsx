import React, { useState } from 'react';

const Education: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="education bg-background min-h-screen">
      {/* 곡 정보 섹션 */}
      <div className="max-w-6xl mx-auto px-4 py-8 mt-28">
        {/* 앨범 아트와 기본 정보 */}
        <div className="totaledu flex flex-col md:flex-row gap-8 mb-12">

            {/* 앨범 아트 */}
            <div className="songbox flex-shrink-0">   
                <div className="w-80 h-80 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                    <span className="text-white text-8xl">
                        ♪
                    </span>
                </div>
            </div>
            
          
            {/* 곡 정보 */}
            <div className="flex-1 flex flex-col justify-between h-80">

                {/* 상단: 곡 정보 */}
                <div className="text-left">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Shape of You</h1>
                    <p className="text-lg text-muted-foreground mb-1">Ed Sheeran</p>
                    <p className="text-sm text-muted-foreground">÷ (Divide)</p>
                </div>
            
                {/* 하단: 재생 컨트롤 */}
                <div className="space-y-4">
                
                    {/* 진행 바 */}
                    <div className="space-y-2 pb-5">
                        <div className="w-1/2 bg-muted rounded-full h-1">
                            <div className="bg-primary h-1 rounded-full" style={{ width: '30%' }}>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground mt-1">
                                <span>0:00</span>
                                <span>3:20</span>
                            </div>
                        </div>
                    </div>
              
                    {/* 재생 컨트롤 */}
                    <div className="flex items-center justify-left gap-6">
                        {/* 재생 버튼 */}
                        <button className="w-11 h-11 bg-primary hover:bg-primary/90 rounded-xl flex items-center justify-center transition-colors shadow-lg">
                            <svg className="w-9 h-9 text-primary-foreground ml-1" fill="currentColor" viewBox="1 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {/* 음소거 버튼 */}
                        <button 
                        onClick={() => setIsMuted(!isMuted)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <div className="relative">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6.343 6.343a1 1 0 011.414 0L12 10.586l4.243-4.243a1 1 0 111.414 1.414L13.414 12l4.243 4.243a1 1 0 01-1.414 1.414L12 13.414l-4.243 4.243a1 1 0 01-1.414-1.414L10.586 12 6.343 7.757a1 1 0 010-1.414z" />
                                </svg>
                                {isMuted && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

             <div className="edutap w-90">
               
               <div className="grid grid-cols-2 gap-4 h-60">
                 {/* 빈칸 퀴즈 */}
                 <div className="edutap-item1 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-2 text-center hover:shadow-xl transition-all duration-300 cursor-pointer group">
                   <h3 className="text-lg font-bold text-white mb-4">빈칸 퀴즈</h3>
                   <div className="flex justify-center mb-4">
                     <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                       <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                       </svg>
                     </div>
                   </div>
                   <div className="text-white text-sm">
                     <p className="mb-1">Sunday Morning,</p>
                     <p>rain is <span className="bg-white/20 px-2 py-1 rounded underline">____</span></p>
                   </div>
                 </div>

                 {/* Speaking 연습 */}
                 <div className="edutap-item2 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-center hover:shadow-xl transition-all duration-300 cursor-pointer group">
                   <h3 className="text-lg font-bold text-white mb-4">speaking 연습</h3>
                   <div className="flex justify-center mb-4">
                     <div className="relative">
                       {/* 3D 스타일 머리 */}
                       <div className="w-16 h-16 bg-gradient-to-br from-purple-300 to-purple-400 rounded-full relative">
                         <div className="absolute top-2 left-2 w-2 h-2 bg-white rounded-full"></div>
                         <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"></div>
                         <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-white rounded-full"></div>
                       </div>
                       {/* 말풍선 */}
                       <div className="absolute -top-1 -right-6 bg-white rounded px-2 py-1 shadow-lg">
                         <span className="text-purple-600 font-bold text-xs">EN</span>
                         <div className="absolute bottom-0 left-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-white"></div>
                       </div>
                       {/* 음파 */}
                       <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                         <div className="flex space-x-1">
                           <div className="w-1 h-2 bg-white/60 rounded-full"></div>
                           <div className="w-1 h-3 bg-white/80 rounded-full"></div>
                           <div className="w-1 h-2 bg-white/60 rounded-full"></div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* 딕테이션 게임 */}
                 <div className="edutap-item3 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-4 text-center hover:shadow-xl transition-all duration-300 cursor-pointer group">
                   <h3 className="text-lg font-bold text-white mb-4">딕테이션 게임</h3>
                   <div className="flex justify-center mb-4">
                     <div className="bg-amber-600 rounded-lg p-3">
                       <div className="grid grid-cols-8 gap-1">
                         {[1,2,3,4,5,6,7,9,10,11,12,13,14,15,16,17,18,20,21,22,23,24,25,26,29,33,33].map((num, index) => (
                           <div key={index} className={`w-4 h-4 rounded border flex items-center justify-center ${
                             [1,10,11,20,21,22,23,24,25,26,29,33].includes(num) 
                               ? 'bg-yellow-300 border-yellow-300' 
                               : 'bg-white border-yellow-300'
                           }`}>
                             <span className="text-xs font-bold text-amber-600">{num}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* 추가 학습 모드 (4번째 슬롯) */}
                 <div className="edutap-item4 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-center hover:shadow-xl transition-all duration-300 cursor-pointer group">
                   <h3 className="text-lg font-bold text-white mb-4">문법 학습</h3>
                   <div className="flex justify-center mb-4">
                     <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                       <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                         <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                     </div>
                   </div>
                   <div className="text-white/80 text-sm">
                     <p>문법 규칙 학습하기</p>
                   </div>
                 </div>
               </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Education;
