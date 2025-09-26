import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { loginAPI, getUserProfileAPI } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navbar from '@/components/common/navbar'
import Footer from '@/pages/common/footer'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [autoLogin, setAutoLogin] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, setUserId } = useAuthStore()

  useEffect(() => {
    document.title = 'Speakle – Login'
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await loginAPI({ email, password })

      if (response.status === 200) {
        const tokens = response.data.data

        // 토큰 저장
        login(tokens)

        // 토큰이 확실히 저장될 때까지 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100))

        try {
          // 사용자 프로필 조회하여 userId 저장
          const profileResponse = await getUserProfileAPI()
          const profileData = profileResponse.data?.data || profileResponse.data

          if (profileData?.id) {
            setUserId(profileData.id)
            // persist 저장이 완료될 때까지 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 200))
          }
        } catch (profileErr) {
          // 프로필 조회 실패해도 로그인은 성공으로 처리
        }

        // redirect 파라미터가 있으면 해당 경로로, 없으면 메인 페이지로
        const redirectTo = searchParams.get('redirect') || '/'
        navigate(redirectTo)
      }
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message)
      } else {
        setError('An unexpected error occurred.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Google Fonts Link */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Pretendard:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <Navbar />
      <div aria-hidden className="h-16 md:h-20" />

      {/* 상단 여백 추가 */}
      <div className="h-16" />

      {/* BODY */}
      <div className="w-screen px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20" style={{ maxWidth: '65vw' }}>
        <main className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16 py-12">
          {/* Left – 보라 패널 */}
          <div className="flex justify-center lg:justify-start">
            <div className="bg-[#3F2176] w-[400px] h-[320px] flex items-center">
              <div className="pl-12 space-y-2 font-extrabold leading-tight tracking-wider text-left text-white">
                <div className="text-[32px] font-['Pretendard']">Speakle과</div>
                <div className="text-[32px] font-['Pretendard']">함께</div>
                <div className="text-[32px] font-['Pretendard']">영어가</div>
                <div className="text-[32px] font-['Pretendard']">입에 착!</div>
              </div>
            </div>
          </div>

          {/* Right – 로그인 카드 */}
          <div className="flex justify-center lg:justify-start">
            <div className="w-full max-w-[400px]">
              <h1 className="text-center text-[28px] font-extrabold leading-snug mb-8 font-['Pretendard']">
                Speakle에 오신 것을 <br /> 환영해요!
              </h1>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="이메일을 입력해주세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 rounded !bg-[#9C8EA6] placeholder:text-slate-700 px-4 text-[14px] focus:outline-none border-0 text-slate-900 font-['Pretendard'] shadow-none"
                />
                <Input
                  type="password"
                  placeholder="비밀번호를 입력해주세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 rounded !bg-[#9C8EA6] placeholder:text-slate-700 px-4 text-[14px] focus:outline-none border-0 text-slate-900 font-['Pretendard'] shadow-none"
                />

                {error && (
                  <p className="text-amber-400 text-sm font-['Pretendard']">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded bg-[#6D6BFF] hover:bg-[#5c5ae6] transition font-semibold font-['Pretendard']"
                >
                  로그인
                </Button>

                <div className="flex items-center justify-between text-[12px] text-white/70 font-['Pretendard']">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="accent-white/80 w-4 h-4"
                      checked={autoLogin}
                      onChange={(e) => setAutoLogin(e.target.checked)}
                    />
                    <span>자동로그인</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span>아직 회원이 아니신가요?</span>
                    <Link to="/signup" className="text-white hover:underline">
                      회원가입
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}
