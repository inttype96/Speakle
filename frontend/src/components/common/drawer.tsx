'use client'

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react'
import { XMarkIcon, LockClosedIcon, AcademicCapIcon, MusicalNoteIcon, TrophyIcon, InformationCircleIcon, UserIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { Button } from "@/components/ui/button"
import { ModeToggle } from '@/components/mode-toggle'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useCustomAlert } from '@/hooks/useCustomAlert'
import { CustomAlert } from '@/components/common/CustomAlert'

export default function Drawer({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const navigate = useNavigate()
  const tokens = useAuthStore((state) => state.tokens);
  const logout = useAuthStore((state) => state.logout);
  const { alertState, showAlert, hideAlert } = useCustomAlert()

  // accessToken 존재 여부로만 로그인 상태 판단
  const isAuthenticated = !!tokens?.accessToken;

  const handleLogout = () => {
    logout();
    setOpen(false);
    window.location.reload();
  };

  // 로그인 확인 후 네비게이션 처리
  const handleProtectedNavigation = (path: string, serviceName: string) => {
    if (!isAuthenticated) {
      // 먼저 드로워를 닫고 약간의 지연 후 모달 표시
      setOpen(false)
      
      setTimeout(() => {
        showAlert(
          {
            title: "로그인이 필요해요",
            message: `${serviceName} 서비스를 이용하려면 로그인이 필요합니다.\n로그인 페이지로 이동하시겠어요?`,
            confirmText: "로그인하러 가기",
            type: "music"
          },
          () => {
            const currentPath = window.location.pathname + window.location.search
            const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`
            navigate(loginUrl)
          }
        )
      }, 300) // 드로워 애니메이션이 끝날 때까지 대기
      return
    }
    
    // 로그인된 경우 해당 페이지로 이동
    setOpen(false) // 드로워 닫기
    navigate(path)
  }

  // 클릭 이벤트 핸들러들
  const handleLearningClick = (e: React.MouseEvent) => {
    e.preventDefault()
    handleProtectedNavigation("/explore", "Learning")
  }

  const handlePlaylistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    handleProtectedNavigation("/playlists", "Playlist")
  }

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    handleProtectedNavigation("/dashboard", "리워드 대시보드")
  }

  const handleMyPageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    handleProtectedNavigation("/mypage", "마이페이지")
  }

  const handleServiceTourClick = () => {
    setOpen(false) // 드로워 닫기
    navigate("/tour")
  }

  return (
    <>
      <Dialog open={open} onClose={setOpen} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-500 ease-in-out data-closed:opacity-0"
        />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <DialogPanel
                transition
                className="pointer-events-auto relative w-screen max-w-md transform border-l border-border transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
              >
                <TransitionChild>
                  <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:pr-4">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="relative rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <span className="absolute -inset-2.5" />
                      <span className="sr-only">Close panel</span>
                      <XMarkIcon aria-hidden="true" className="size-6" />
                    </button>
                  </div>
                </TransitionChild>
                <div className="relative flex h-full flex-col overflow-y-auto bg-background py-6 shadow-xl">
                  <div className="px-4 sm:px-6">
                    <DialogTitle className="text-base font-semibold text-foreground">메뉴</DialogTitle>
                  </div>
                  <div className="relative mt-6 flex-1 px-4 sm:px-6">
                    {/* 메인 서비스 메뉴 */}
                    <Button asChild variant="outline" size="lg" className="w-full mb-2" onClick={handleLearningClick}>
                      <Link to="/explore" className="flex items-center justify-center">
                        <AcademicCapIcon className="h-6 w-6 mr-2" /> Learning
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full mb-2" onClick={handlePlaylistClick}>
                      <Link to="/playlists" className="flex items-center justify-center">
                        <MusicalNoteIcon className="h-6 w-6 mr-2" /> Playlist
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full mb-2" onClick={handleDashboardClick}>
                      <Link to="/dashboard" className="flex items-center justify-center">
                        <TrophyIcon className="h-6 w-6 mr-2" /> 리워드 대시보드
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full mb-2" onClick={handleServiceTourClick}>
                      <Link to="/tour" className="flex items-center justify-center">
                        <InformationCircleIcon className="h-6 w-6 mr-2" /> 서비스 둘러보기
                      </Link>
                    </Button>

                    {/* 구분선 */}
                    <div className="border-t border-border my-4"></div>

                    {/* 로그인 상태에 따른 조건부 렌더링 */}
                    {!isAuthenticated ? (
                      <>
                        <Button asChild variant="outline" size="lg" className="w-full mb-2">
                          <Link to="/login" className="flex items-center justify-center">
                            <LockClosedIcon className="h-6 w-6 mr-2" /> 로그인
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="w-full mb-2">
                          <Link to="/signup" className="flex items-center justify-center">
                            <UserPlusIcon className="h-6 w-6 mr-2" /> 회원가입
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button asChild variant="outline" size="lg" className="w-full mb-2" onClick={handleMyPageClick}>
                          <Link to="/mypage" className="flex items-center justify-center">
                            <UserIcon className="h-6 w-6 mr-2" /> 마이페이지
                          </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="w-full mb-2" onClick={handleLogout}>
                          <LockClosedIcon className="h-6 w-6 mr-2" /> 로그아웃
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="relative mt-6 flex-1 px-4 sm:px-6 flex flex-col justify-end">
                    <ModeToggle />
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

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
    </>
  )
}