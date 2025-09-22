'use client'

import { useState } from "react"
import { Link } from "react-router-dom"
import Drawer from "@/components/common/drawer"
import { Bars3Icon } from '@heroicons/react/24/solid'
import { SearchForm } from "@/components/common/search-form"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useAuthStore } from '@/store/auth'

export default function Navbar() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const { theme, setTheme } = useTheme()
    const tokens = useAuthStore((state) => state.tokens)
    const isAuthenticated = !!tokens?.accessToken

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    return (
        <>
            <header className="absolute inset-x-0 top-0 z-50">
                <nav aria-label="Global">
                    <div className="flex items-center justify-between p-6 pb-4 ml-1">
                        {/* 로고 */}
                        <div className="flex">
                            <Link to="/" className="-m-1.5 p-1.5">
                                <span className="sr-only">Speakle</span>
                                <img
                                    alt="Speakle Logo"
                                    src="/speakle_logo.png"
                                    className="h-18 w-auto"
                                />
                            </Link>
                        </div>

                        {/* Learning, Playlist, 리워드 대시보드, 서비스 둘러보기 */}
                        <div className="service grid grid-cols-2 gap-2 text-sm justify-items-start ml-10">
                            <Link to="/explore" className="px-3 py-1 rounded cursor-pointer transition-colors font-bold text-xl hover:text-gray-300">
                                Learning
                            </Link>
                            <Link to="/playlists" className="px-3 py-1 rounded cursor-pointer transition-colors font-bold text-xl hover:text-gray-300">
                                Playlist
                            </Link>
                            <Link to="/dashboard" className="px-3 py-1 rounded cursor-pointer transition-colors text-[#848484] hover:text-gray-300">
                                리워드 대시보드
                            </Link>
                            <Link to="/explore" className="px-3 py-1 rounded cursor-pointer transition-colors text-[#848484] hover:text-gray-300">
                                서비스 둘러보기
                            </Link>
                        </div>

                        {/* 검색창 + 다크모드 토글 */}
                        <div className="flex-1 flex justify-center items-center px-10 gap-4">
                            <div className="w-xl">
                                <SearchForm />
                            </div>
                            <button
                                onClick={toggleTheme}
                                className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="테마 변경"
                            >
                                <Sun className="h-5 w-5 transition-all dark:scale-0" />
                                <Moon className="absolute top-2 left-2 h-5 w-5 scale-0 transition-all dark:scale-100" />
                            </button>
                        </div>

                        {/* 로그인, 로그아웃, 회원가입 */}
                        <div className="auth flex items-center gap-4">
                            {!isAuthenticated ? (
                                <>
                                    <Link to="/login" className="px-3 py-1 rounded cursor-pointer transition-colors hover:text-gray-300">
                                        로그인
                                    </Link>
                                    <Link to="/signup" className="mr-6 px-3 py-1 rounded cursor-pointer transition-colors hover:text-gray-300">
                                        회원가입
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/mypage" className="px-3 py-1 rounded cursor-pointer transition-colors hover:text-gray-300">
                                        마이페이지
                                    </Link>
                                    <button
                                        onClick={() => {
                                            useAuthStore.getState().logout();
                                            window.location.reload();
                                        }}
                                        className="mr-6 px-3 py-1 rounded cursor-pointer transition-colors hover:text-gray-300"
                                    >
                                        로그아웃
                                    </button>
                                </>
                            )}
                        </div>

                        {/* drawer */}
                        <div className="flex justify-end mr-4 gap-x-4">
                            <Bars3Icon className="h-10 w-10 mt-0.5 cursor-pointer" onClick={() => setDrawerOpen(true)}>메뉴</Bars3Icon>
                        </div>
                    </div>
                </nav>
            </header>
            {/* 드로워 */}
            <Drawer open={drawerOpen} setOpen={setDrawerOpen} />
        </>
    )
}