import Navbar from "@/components/common/navbar"
import Footer from "./footer"
import HeadphoneImage from '@/assets/images/headset2.png'
import BallonImage from '@/assets/images/ballon.png'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import SplashCursor from '@/lib/splashCursor'
import { useRandomSong } from "@/hooks/useRandomSong"

export default function IndexPage() {
  const navigate = useNavigate()
  const { getRandomSong, isLoading } = useRandomSong()

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <SplashCursor />

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr]">

        {/* 왼쪽 섹션 - 검정 배경 */}
        <div className="bg-black flex flex-col items-center justify-center text-center py-32 -ml-[100vw] pl-[100vw] pr-12">
          <div className="relative">
            <img
              src={HeadphoneImage}
              alt="Headset"
              className="w-[28rem] h-[28rem] object-contain mx-auto"
            />
            <h1 className="absolute inset-0 flex items-center justify-center text-8xl font-extrabold font-poppins text-white">
              Speakle
            </h1>
          </div>
          <p className="mt-8 text-2xl text-gray-300 leading-relaxed">
            음악처럼 스며드는 영어학습 <br />
            듣고, 따라하고, 오래 남는 영어
          </p>
        </div>

        {/* 오른쪽 섹션 */}
        <div className="flex flex-col space-y-6 px-12 py-32">
          {/* 오늘의 기분 카드 */}
          <Card className="bg-[#B5A6E0] text-black rounded-2xl shadow-lg">
            <CardContent className="py-2 px-6">
              <p className="font-semibold text-2xl mb-2">오늘의 기분이나 상황은 어떠신가요?</p>
              <p className="text-m text-gray-800">
                장소와 상황, 분위기에 맞춘 영어 학습을 시작해보세요.
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={() => navigate("/explore")}
                  className="mt-4 bg-[#4B2199] text-white rounded-full px-4 py-2"
                >
                  팝송 추천받으러 가기 →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 랜덤 노래 카드 */}
          <Card className="bg-[#4A3B63] text-white rounded-2xl shadow-lg">
            <CardContent className="py-2 px-6">
              <p className="font-semibold text-2xl mb-2">랜덤 노래로 학습하기</p>
              <p className="text-m text-gray-300">
                <span className="font-bold">speakle</span>이 추천하는 노래로 영어 학습을 시작해보세요.
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={getRandomSong}
                  disabled={isLoading}
                  className="mt-4 bg-[#B5A6E0] text-black rounded-full px-4 py-2 hover:bg-[#9B8BC7]"
                >
                  {isLoading ? "추천 중..." : "랜덤 노래 추천받기 →"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Why Speakle */}
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-end space-x-2">
              <img src={BallonImage} alt="Balloon" className="w-8 h-8" />
              <p className="font-bold text-2xl text-gray-900 dark:text-white">왜 Speakle인가 ?</p>
            </div>

            {/* 대화형 말풍선 */}
            <div className="flex justify-start">
              <div className="bg-[#7070BA] rounded-2xl px-5 py-3 text-white max-w-[100%]">
                멜로디가 들어가면 단어가 아닌 문장을 기억해요.
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-[#6C5F8D] rounded-2xl px-5 py-3 text-white max-w-[70%]">
                퀴즈, 딕테이션 게임, 스피킹 연습을 통한 코스형 회화 연습을 즐겨보세요.
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-[#7070BA] rounded-2xl px-5 py-3 text-white max-w-[80%]">
                가사에서 배울 수 있는 단어, 표현, 문화, 응용 표현까지 한번에!
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
