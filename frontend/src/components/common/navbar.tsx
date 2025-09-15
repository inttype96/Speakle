'use client'

import { useState } from "react"
import Drawer from "@/components/common/drawer"
import { Bars3Icon } from '@heroicons/react/24/solid'
import { SearchForm } from "@/components/common/search-form"

export default function Navbar() {
    const [drawerOpen, setDrawerOpen] = useState(false)

    return (
        <>
            <header className="absolute inset-x-0 top-0 z-50">
                <nav
                    aria-label="Global"
                >
                    <div className="mx-auto max-w-6xl flex items-center justify-between p-6 lg:px-8">
                        {/* 로고 */}
                        <div className="flex lg:flex-1">
                            <a href="#" className="-m-1.5 p-1.5">
                                <span className="sr-only">Speakle</span>
                                <img
                                    alt=""
                                    src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                                    className="h-8 w-auto"
                                />
                            </a>
                        </div>

                        {/* 검색창 */}
                        <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
                            <div className="max-w-lg w-full lg:max-w-xs">
                                <SearchForm />
                            </div>
                        </div>

                        {/* drawer */}
                        <div className="flex flex-1 justify-end mr-4 gap-x-4">
                            <Bars3Icon className="h-8 w-8 mt-0.5" onClick={() => setDrawerOpen(true)}>메뉴</Bars3Icon>
                        </div>
                    </div>
                </nav>
            </header>
            {/* 드로워 */}
            <Drawer open={drawerOpen} setOpen={setDrawerOpen} />
        </>
    )
}
