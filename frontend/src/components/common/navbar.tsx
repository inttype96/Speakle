'use client'

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Drawer from "@/components/common/drawer"
import { Bars3Icon } from '@heroicons/react/24/solid'
import { SearchForm } from "@/components/common/search-form"
import { useAuthStore } from '@/store/auth'
import { useCustomAlert } from '@/hooks/useCustomAlert'
import { CustomAlert } from '@/components/common/CustomAlert'

export default function Navbar() {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const navigate = useNavigate()
    const tokens = useAuthStore((state) => state.tokens)
    const isAuthenticated = !!tokens?.accessToken
    const { alertState, showAlert, hideAlert } = useCustomAlert()

    // 로그인 확인 후 네비게이션 처리
    const handleProtectedNavigation = (path: string, serviceName: string) => {
        if (!isAuthenticated) {
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
            return
        }
        
        // 로그인된 경우 해당 페이지로 이동
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

    const handleServiceTourClick = (e: React.MouseEvent) => {
        e.preventDefault()
        navigate("/explore")
    }

    return (
        <>
            <header className="absolute inset-x-0 top-0 z-50 bg-black">
                <nav aria-label="Global">
                    <div className="flex items-center justify-between p-4">
                        {/* 로고 */}
                        <div className="flex">
                            <Link to="/" className="-m-1.5 p-1.5">
                                <span className="sr-only">Speakle</span>
                                <img
                                    alt="Speakle Logo"
                                    src="/speakle_logo.png"
                                    className="h-12 lg:h-18 w-auto"
                                />
                            </Link>
                        </div>

                        {/* Learning, Playlist, 리워드 대시보드, 서비스 둘러보기 - 데스크톱에서만 표시 */}
                        <div className="hidden xl:grid service grid-cols-2 gap-2 text-sm justify-items-start ml-10">
                            <a 
                                href="/explore" 
                                onClick={handleLearningClick}
                                className="px-3 py-1 rounded cursor-pointer transition-colors font-bold text-xl text-white hover:text-gray-300"
                            >
                                Learning
                            </a>
                            <a 
                                href="/playlists" 
                                onClick={handlePlaylistClick}
                                className="px-3 py-1 rounded cursor-pointer transition-colors font-bold text-xl text-white hover:text-gray-300"
                            >
                                Playlist
                            </a>
                            <a 
                                href="/dashboard" 
                                onClick={handleDashboardClick}
                                className="px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300"
                            >
                                리워드 대시보드
                            </a>
                            <a 
                                href="/tour" 
                                onClick={handleServiceTourClick}
                                className="px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300"
                            >
                            </Link>
                            <Link to="/tour" className="px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300">
                                서비스 둘러보기
                            </a>
                        </div>

                        {/* 검색창 - 모바일에서 중앙, 데스크톱에서 확장 */}
                        <div className="flex-1 flex justify-center items-center px-2 lg:px-10">
                            <div className="w-full max-w-xs lg:max-w-md">
                                <SearchForm />
                            </div>
                        </div>

                        {/* 로그인, 로그아웃, 회원가입 - 데스크톱에서만 표시 */}
                        <div className="hidden lg:flex auth items-center gap-4">
                            {!isAuthenticated ? (
                                <>
                                    <Link to="/login" className="px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300">
                                        로그인
                                    </Link>
                                    <Link to="/signup" className="mr-6 px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300">
                                        회원가입
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/mypage" className="px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300">
                                        마이페이지
                                    </Link>
                                    <button
                                        onClick={() => {
                                            useAuthStore.getState().logout();
                                            window.location.reload();
                                        }}
                                        className="mr-6 px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300"
                                    >
                                        로그아웃
                                    </button>
                                </>
                            )}
                        </div>

                        {/* drawer - 항상 표시 */}
                        <div className="flex justify-end mr-2 lg:mr-4 gap-x-4">
                            <Bars3Icon className="h-8 lg:h-10 w-8 lg:w-10 cursor-pointer text-white" onClick={() => setDrawerOpen(true)}>메뉴</Bars3Icon>
                        </div>
                    </div>
                </nav>
            </header>
            
            {/* 드로워 */}
            <Drawer open={drawerOpen} setOpen={setDrawerOpen} />
            
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

// 'use client'

// import { useState } from "react"
// import { Link } from "react-router-dom"
// import Drawer from "@/components/common/drawer"
// import { Bars3Icon } from '@heroicons/react/24/solid'
// import { SearchForm } from "@/components/common/search-form"
// import { useAuthStore } from '@/store/auth'

// export default function Navbar() {
//     const [drawerOpen, setDrawerOpen] = useState(false)
//     const tokens = useAuthStore((state) => state.tokens)
//     const isAuthenticated = !!tokens?.accessToken

//     return (
//         <>
//             <header className="absolute inset-x-0 top-0 z-50 bg-black">
//                 <nav aria-label="Global">
//                     <div className="flex items-center justify-between p-4">
//                         {/* 로고 */}
//                         <div className="flex">
//                             <Link to="/" className="-m-1.5 p-1.5">
//                                 <span className="sr-only">Speakle</span>
//                                 <img
//                                     alt="Speakle Logo"
//                                     src="/speakle_logo.png"
//                                     className="h-12 lg:h-18 w-auto"
//                                 />
//                             </Link>
//                         </div>

//                         {/* Learning, Playlist, 리워드 대시보드, 서비스 둘러보기 - 데스크톱에서만 표시 */}
//                         <div className="hidden xl:grid service grid-cols-2 gap-2 text-sm justify-items-start ml-10">
//                             <Link to="/explore" className="px-3 py-1 rounded cursor-pointer transition-colors font-bold text-xl text-white hover:text-gray-300">
//                                 Learning
//                             </Link>
//                             <Link to="/playlists" className="px-3 py-1 rounded cursor-pointer transition-colors font-bold text-xl text-white hover:text-gray-300">
//                                 Playlist
//                             </Link>
//                             <Link to="/dashboard" className="px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300">
//                                 리워드 대시보드
//                             </Link>
//                             <Link to="/explore" className="px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300">
//                                 서비스 둘러보기
//                             </Link>
//                         </div>

//                         {/* 검색창 - 모바일에서 중앙, 데스크톱에서 확장 */}
//                         <div className="flex-1 flex justify-center items-center px-2 lg:px-10">
//                             <div className="w-full max-w-xs lg:max-w-md">
//                                 <SearchForm />
//                             </div>
//                         </div>

//                         {/* 로그인, 로그아웃, 회원가입 - 데스크톱에서만 표시 */}
//                         <div className="hidden lg:flex auth items-center gap-4">
//                             {!isAuthenticated ? (
//                                 <>
//                                     <Link to="/login" className="px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300">
//                                         로그인
//                                     </Link>
//                                     <Link to="/signup" className="mr-6 px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300">
//                                         회원가입
//                                     </Link>
//                                 </>
//                             ) : (
//                                 <>
//                                     <Link to="/mypage" className="px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300">
//                                         마이페이지
//                                     </Link>
//                                     <button
//                                         onClick={() => {
//                                             useAuthStore.getState().logout();
//                                             window.location.reload();
//                                         }}
//                                         className="mr-6 px-3 py-1 rounded cursor-pointer transition-colors text-white hover:text-gray-300"
//                                     >
//                                         로그아웃
//                                     </button>
//                                 </>
//                             )}
//                         </div>

//                         {/* drawer - 항상 표시 */}
//                         <div className="flex justify-end mr-2 lg:mr-4 gap-x-4">
//                             <Bars3Icon className="h-8 lg:h-10 w-8 lg:w-10 cursor-pointer text-white" onClick={() => setDrawerOpen(true)}>메뉴</Bars3Icon>
//                         </div>
//                     </div>
//                 </nav>
//             </header>
//             {/* 드로워 */}
//             <Drawer open={drawerOpen} setOpen={setDrawerOpen} />
//         </>
//     )
// }