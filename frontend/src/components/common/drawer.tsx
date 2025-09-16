'use client'

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react'
import { XMarkIcon, LockClosedIcon, StarIcon, TrophyIcon, UserIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { Button } from "@/components/ui/button"
import { ModeToggle } from '@/components/mode-toggle'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

export default function Drawer({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const tokens = useAuthStore((state) => state.tokens);
  const logout = useAuthStore((state) => state.logout);

  // accessToken 존재 여부로만 로그인 상태 판단
  const isAuthenticated = !!tokens?.accessToken;

  const handleLogout = () => {
    logout();
    setOpen(false);
    window.location.reload();
  };
  return (
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
                  {/* 로그인 상태에 따른 조건부 렌더링 */}
                  {!isAuthenticated ? (
                    <Button asChild variant="outline" size="lg" className="w-full mb-2">
                      <Link to="/login" className="flex items-center justify-center">
                        <LockClosedIcon className="h-6 w-6 mr-2" /> 로그인
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="lg" className="w-full mb-2" onClick={handleLogout}>
                      <LockClosedIcon className="h-6 w-6 mr-2" /> 로그아웃
                    </Button>
                  )}
                  <Button variant="outline" size="lg" className="w-full mb-2">
                    <Link to="/leaderboard" className="flex items-center justify-center">
                      <StarIcon className="h-6 w-6 mr-2" /> 노래 추천 받기
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full mb-2">
                    <Link to="/leaderboard" className="flex items-center justify-center">
                      <TrophyIcon className="h-6 w-6 mr-2" /> 리더보드
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full mb-2">
                    <Link to="/mypage" className="flex items-center justify-center">
                      <UserIcon className="h-6 w-6 mr-2" /> 마이페이지
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full mb-2">
                    <Link to="/about" className="flex items-center justify-center">
                      <InformationCircleIcon className="h-6 w-6 mr-2" /> 소개
                    </Link>
                  </Button>
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
  )
}