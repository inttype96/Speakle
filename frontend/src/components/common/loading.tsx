'use client'

import { useEffect, useState } from "react"

interface LoadingProps {
  title?: string
  subtitle?: string
  showProgress?: boolean
}

export default function Loading({
  title = "음악 추천을 생성하고 있어요",
  subtitle = "잠시만 기다려 주세요...",
  showProgress = true
}: LoadingProps) {
  const [dots, setDots] = useState("")
  const [progress, setProgress] = useState(0)

  // 점점점 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // 가짜 프로그레스 바 (실제 API 진행률이 없으므로)
  useEffect(() => {
    if (!showProgress) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev // 90%에서 멈춤 (API 완료 시까지)
        return prev + Math.random() * 15
      })
    }, 800)

    return () => clearInterval(interval)
  }, [showProgress])

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background border rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center space-y-6">
          {/* 로고와 스피너 */}
          <div className="relative flex justify-center">
            <div className="relative">
              {/* 회전하는 원 */}
              <div className="w-20 h-20 border-4 border-primary/20 rounded-full animate-spin border-t-primary"></div>
              {/* 중앙 로고 */}
              <div className="absolute inset-0 flex items-center justify-center bg-black rounded-full">
                <img
                  src="/speakle_logo.png"
                  alt="Speakle"
                  className="w-12 h-12 object-contain animate-pulse"
                />
              </div>
            </div>
          </div>

          {/* 타이틀 */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              {title}{dots}
            </h2>
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>

          {/* 프로그레스 바 */}
          {showProgress && (
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(progress)}% 완료
              </p>
            </div>
          )}

          {/* 로딩 메시지들 */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>🎵 음악 데이터 분석 중...</p>
            <p> AI가 맞춤 추천을 준비하고 있어요</p>
            <p> 곧 완성됩니다!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 전체 화면 로딩 (페이지 전환용)
export function FullScreenLoading({
  title = "페이지를 불러오고 있어요",
  subtitle = "잠시만 기다려 주세요..."
}: LoadingProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* 로고와 스피너 */}
        <div className="relative flex justify-center">
          <div className="relative">
            {/* 회전하는 원 */}
            <div className="w-24 h-24 border-4 border-primary/20 rounded-full animate-spin border-t-primary"></div>
            {/* 중앙 로고 */}
            <div className="absolute inset-0 flex items-center justify-center bg-black rounded-full">
              <img
                src="/speakle_logo.png"
                alt="Speakle"
                className="w-16 h-16 object-contain animate-pulse"
              />
            </div>
          </div>
        </div>

        {/* 타이틀 */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  )
}