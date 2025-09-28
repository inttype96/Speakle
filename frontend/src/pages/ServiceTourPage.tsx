import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/common/navbar";
import { Button } from "@/components/ui/button";
import Footer from "@/pages/common/footer";
import serviceTourImage from "@/assets/images/serviceTour.png";
import mainPageImage from "@/assets/images/mainPage.png";
import dictationPageImage from "@/assets/images/dictationPage.png";
import quizPageImage from "@/assets/images/QuizPage.png";
import speakingPageImage from "@/assets/images/SpeakingPage.png";
import recommendationPageImage from "@/assets/images/RecommendationPage.png";
import webUIImage from "@/assets/images/WebUI.png";
import appUIImage from "@/assets/images/AppUI.png";

// icons
import {
  Play,
  Headphones,
  Type,
  MicVocal,
  Music,
  CheckCircle
} from "lucide-react";

export default function ServiceTourPage() {
  const [, setActiveSection] = useState(0);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionsRef.current.findIndex(
              (ref) => ref === entry.target
            );
            if (index !== -1) {
              setActiveSection(index);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    sectionsRef.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      id: "search",
      icon: Music,
      title: "Speakle과 함께 팝송으로 배우는 영어",
      subtitle: "팝송으로 배우는 영어",
      description: "검색창에서 좋아하는 노래를 찾거나 Speakle의 추천을 받아 학습을 시작하세요. 실시간 가사 동기화와 한국어 번역으로 완벽한 이해가 가능합니다.",
      image: mainPageImage,
      features: ["검색창에서 노래 검색", "상황 & 장소에 따른 맞춤 추천 받기", "가사 보며 음악 감상"]
    },
    {
      id: "dictation",
      icon: Headphones,
      title: "딕테이션",
      subtitle: "음악으로 훈련하는 청취력",
      description: "'놀라운 토요일'의 딕테이션 게임을 Speakle에서 ! 노래를 재생하고 들리는 대로 빈칸을 채워보세요. 메모장에 자유롭게 기록하고 힌트를 활용해 정답을 맞춰보세요. 암기가 쏙쏙, 한국어 가사를 보며 영어 가사를 유추함으로서 당신의 회화 능력을 키울 수 있습니다.",
      image: dictationPageImage,
      features: ["음악 재생하며 듣기", "빈칸에 단어 입력하기", "메모장에 자유 기록"]
    },
    {
      id: "quiz",
      icon: Type,
      title: "빈칸 퀴즈",
      subtitle: "문맥으로 배우는 영단어",
      description: "가사에서 핵심 단어가 빈칸으로 표시됩니다. 문맥을 파악해 올바른 단어를 선택하고 어휘력을 키워보세요.",
      image: quizPageImage,
      features: ["가사 읽고 문맥 파악", "보기에서 정답 선택", "결과 확인하고 복습"]
    },
    {
      id: "speaking",
      icon: MicVocal,
      title: "AI 발음 연습",
      subtitle: "정확한 발음 학습",
      description: "마이크 버튼을 누르고 가사를 따라 읽어보세요. AI가 발음을 분석해 점수를 알려드립니다.",
      image: speakingPageImage,
      features: ["마이크로 녹음하기", "가사 따라 읽기", "AI 점수 확인하기"]
    },
    {
      id: "recommendations",
      icon: Music,
      title: "스마트 추천 시스템",
      subtitle: "상황에 맞는 노래 추천",
      description: "메인 페이지에서 랜덤 추천을 받거나, 상황별·장소별 카테고리를 선택해 맞춤 음악을 찾아보세요.",
      image: recommendationPageImage,
      features: ["메인에서 랜덤 추천", "상황별 카테고리 선택", "장소별 음악 탐색"]
    },
    {
      id: "crossplatform",
      icon: Play,
      title: "웹 & 모바일 지원",
      subtitle: "언제 어디서나 학습",
      description: "컴퓨터 웹브라우저로 집중 학습하고, 스마트폰으로 이동 중에도 계속 학습하세요. 모든 기기에서 동일한 경험을 제공합니다.",
      image: webUIImage,
      features: ["PC에서 웹 접속", "모바일로 언제든지", "기기 간 연동 학습"]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Google Fonts Link */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />

      {/* 히어로 섹션 */}
      <section
        ref={(el) => {
          sectionsRef.current[0] = el;
        }}
        className="relative pt-24 pb-8 px-4"
      >
        <div className="mx-auto max-w-5xl">
          <img
            src={serviceTourImage}
            alt="SPEAKLE 서비스 투어"
            className="w-full h-auto bg-transparent"
            style={{ backgroundColor: 'transparent' }}
          />
        </div>
      </section>

      {/* 메시지 섹션 */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-lg md:text-2xl text-white leading-relaxed font-['Pretendard']">
            영어 공부, 더 이상 혼자가 아닙니다. Speakle과 함께라면 노래 한 곡이 당신의 교과서가 됩니다.<br />
            딱 1곡, 딱 5분! 좋아하는 팝송으로 듣기·말하기·쓰기까지 한 번에 완성하세요.<br />
            영어 공부를 시작하려 했다면, 더 이상 미루지 마세요. 노래만 들어도 영어가 쌓이는 순간, Speakle이 만듭니다.
          </p>
        </div>
      </section>

      {/* 기능 섹션들 */}
      {features.map((feature, index) => (
        <section
          key={feature.id}
          ref={(el) => {
            sectionsRef.current[index + 1] = el;
          }}
          className="py-16 md:py-24 px-4"
        >
          <div className="mx-auto max-w-7xl">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
              index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
            }`}>

              {/* 텍스트 콘텐츠 */}
              <div className={`${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                <h2 className="mb-3 text-2xl md:text-3xl font-['Pretendard'] font-bold text-white leading-tight">
                  {feature.title}
                </h2>

                <p className="mb-4 text-white/80 font-['Pretendard']">
                  {feature.description}
                </p>

                {/* 기능 리스트 */}
                <div className="space-y-3">
                  {feature.features.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-[#B5A6E0] flex-shrink-0" />
                      <span className="text-white/90 font-['Pretendard'] text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 이미지 */}
              <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                {feature.id === 'crossplatform' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex items-center justify-center">
                      <img
                        src={appUIImage}
                        alt="모바일 앱 UI"
                        className="w-auto h-auto max-h-[500px] rounded-lg shadow-2xl transform scale-110"
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <img
                        src={webUIImage}
                        alt="웹 UI"
                        className="w-full h-auto max-h-[500px] object-contain rounded-lg shadow-2xl transform scale-110"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center">
                    <img
                      src={feature.image}
                      alt={`${feature.title} 기능 이미지`}
                      className="w-full h-auto min-h-[400px] max-h-[600px] object-contain rounded-lg shadow-2xl transform scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff' font-family='system-ui' font-size='14'%3E이미지%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA 섹션 */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="mb-4 text-2xl font-['Pretendard'] font-bold text-white">
              지금 시작하세요
            </h2>
            <p className="mb-6 text-white/80 font-['Pretendard']">
              무료로 체험할 수 있습니다.
            </p>
            <div className="flex justify-center">
              <Button
                className="bg-white text-[#4B2199] hover:bg-gray-50 px-6 py-2 rounded-lg font-['Pretendard'] font-medium"
                asChild
              >
                <Link to="/signup">시작하기</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}