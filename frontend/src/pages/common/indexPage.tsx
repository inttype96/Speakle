import Navbar from "@/components/common/navbar"
import Footer from "./footer"
import HeadphoneImage from '@/assets/images/headset2.png'
import BallonImage from '@/assets/images/ballon.png'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import SplashCursor from '@/lib/splashCursor'
import { useRandomSong } from "@/hooks/useRandomSong"
import { isAuthenticated } from "@/store/auth"
import { useCustomAlert } from '@/hooks/useCustomAlert'
import { CustomAlert } from '@/components/common/CustomAlert'

export default function IndexPage() {
  const navigate = useNavigate()
  const { getRandomSong, isLoading } = useRandomSong()
  const { alertState, showAlert, hideAlert } = useCustomAlert()

  const handlePopRecommendation = () => {
    // 로그인 확인
    if (!isAuthenticated()) {
      showAlert(
        {
          title: "로그인이 필요해요",
          message: "팝송 추천 서비스를 이용하려면 로그인이 필요합니다.\n로그인 페이지로 이동하시겠어요?",
          confirmText: "로그인하러 가기",
          type: "music"
        },
        () => {
          // 현재 페이지를 redirect 파라미터로 저장
          const currentPath = window.location.pathname + window.location.search
          const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`
          navigate(loginUrl)
        }
      )
      return
    }
    
    // 로그인된 경우 팝송 추천 페이지로 이동
    navigate("/explore")
  }

  return (
    <div className="bg-background min-h-screen flex flex-col font-sans">
      {/* Google Fonts Link */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <Navbar />
      <SplashCursor />

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr]">

        {/* 왼쪽 섹션 */}
        <div className="flex flex-col items-center justify-start text-center pt-24 pb-6 px-9 group">
          <div className="relative">
            <img
              src={HeadphoneImage}
              alt="Headset"
              className="w-[32rem] h-[32rem] object-contain mx-auto transition-all duration-500 group-hover:scale-105 group-hover:rotate-1 filter drop-shadow-2xl"
            />
            <h1 className="absolute inset-0 flex items-center justify-center text-8xl font-black font-['Inter'] text-white transition-all duration-300 group-hover:text-purple-200 tracking-tight">
              Speakle
            </h1>
          </div>
          <p className="-mt-10 text-xl text-gray-300 leading-relaxed transition-colors duration-300 group-hover:text-gray-100 font-['Pretendard'] font-light">
            음악처럼 스며드는 영어학습 <br />
            <span className="font-medium">듣고, 따라하고, 오래 남는</span> 영어
          </p>
        </div>

        {/* 오른쪽 섹션 */}
        <div className="flex flex-col space-y-4 px-20 py-30">
          {/* 오늘의 기분 카드 */}
          <Card className="bg-[#B5A6E0] text-black rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer group">
            <CardContent className="py-2 px-5">
              <p className="font-bold text-xl mb-2 transition-colors duration-300 group-hover:text-gray-800 font-['Pretendard'] tracking-tight">
                오늘의 기분이나 상황은 어떠신가요?
              </p>
              <p className="text-m text-[#694869] transition-colors duration-300 group-hover:text-gray-700 mb-2 font-['Pretendard'] font-medium leading-relaxed">
                장소와 상황, 분위기에 맞춘 영어 학습을 시작해보세요.
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={handlePopRecommendation}
                  className="mt-2 bg-[#4B2199] hover:bg-purple-700 text-white rounded-full px-3 py-1.5 text-sm transition-all duration-300 hover:scale-110 hover:shadow-lg group font-['Pretendard'] font-semibold"
                >
                  팝송 추천받으러 가기
                  <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 랜덤 노래 카드 */}
          <Card className="bg-[#4A3B63] text-white rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer group">
            <CardContent className="py-2 px-5">
              <p className="font-bold text-xl mb-2 transition-colors duration-300 group-hover:text-gray-100 font-['Pretendard'] tracking-tight">
                랜덤 노래로 학습하기
              </p>
              <p className="text-m text-gray-300 transition-colors duration-300 group-hover:text-gray-200 mb-2 font-['Pretendard'] font-medium leading-relaxed">
                <span className="font-bold text-purple-300 transition-colors duration-300 group-hover:text-purple-200">Speakle</span>이 추천하는 노래로 영어 학습을 시작해보세요.
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={getRandomSong}
                  disabled={isLoading}
                  className="mt-2 bg-[#B5A6E0] text-black rounded-full px-3 py-1.5 text-sm hover:bg-[#9B8BC7] hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg group disabled:hover:scale-100 font-['Pretendard'] font-semibold"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-3 h-3 border-2 border-gray-600 border-t-gray-300 rounded-full mr-1.5"></div>
                      추천 중...
                    </>
                  ) : (
                    <>
                      랜덤 노래 추천받기
                      <span className="ml-1 transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Why Speakle */}
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-end space-x-2 group">
              <img src={BallonImage} alt="Balloon" className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
              <p className="font-black text-lg text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 font-['Pretendard'] tracking-tight">
                왜 Speakle인가?
              </p>
            </div>

            {/* 대화형 말풍선 */}
            <div className="flex justify-start">
              <div className="bg-[#7070BA] rounded-2xl px-4 py-2.5 text-white max-w-[100%] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/25 hover:scale-[1.02] cursor-pointer">
                <p className="text-sm font-['Pretendard'] font-medium leading-relaxed">
                  멜로디가 들어가면 단어가 아닌 <span className="font-bold underline decoration-purple-300/50">문장을 기억</span>해요.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-[#6C5F8D] rounded-2xl px-4 py-2.5 text-white max-w-[70%] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/25 hover:scale-[1.02] cursor-pointer">
                <p className="text-sm font-['Pretendard'] font-medium leading-relaxed">
                  퀴즈, 딕테이션 게임, 스피킹 연습을 통한 <span className="font-bold underline decoration-indigo-300/50">코스형 회화 연습</span>을 즐겨보세요.
                </p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-[#7070BA] rounded-2xl px-4 py-2.5 text-white max-w-[90%] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/25 hover:scale-[1.02] cursor-pointer">
                <p className="text-sm font-['Pretendard'] font-medium leading-relaxed">
                  가사에서 배울 수 있는 단어, 표현, 문화, <span className="font-bold underline decoration-purple-300/50">응용 표현까지</span> 한번에!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

       {/* 커스텀 알림 모달 */}
      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        title={alertState.options.title}
        message={alertState.options.message}
        confirmText={alertState.options.confirmText}
        type={alertState.options.type}
        onConfirm={alertState.onConfirm}
      />

      <Footer />
    </div>
  )
}
