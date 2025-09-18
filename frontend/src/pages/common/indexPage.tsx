import Navbar from "@/components/common/navbar"
import Footer from "./footer"
import SplashCursor from '@/lib/splashCursor'
import Plasma from './Plasma';


export default function IndexPage() {
    return (
        <div className="bg-background text-foreground">
            <div style={{ width: '100%', height: '600px', position: 'relative' }}>
                <Plasma
                    color="#ff6b35"
                    speed={0.6}
                    direction="forward"
                    scale={1.1}
                    opacity={0.8}
                    mouseInteractive={true}
                />
            </div>
            <SplashCursor />
            <Navbar />

            {/* Hero Section */}
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                    {/* <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                        <div className="relative rounded-full px-3 py-1 text-sm text-muted-foreground ring-1 ring-border hover:ring-foreground/40">
                            Announcing our next round of funding.{" "}
                            <a href="#" className="font-semibold text-primary">
                                <span aria-hidden="true" className="absolute inset-0" />
                                Read more <span aria-hidden="true">&rarr;</span>
                            </a>
                        </div>
                    </div> */}
                    <div className="text-center">
                        <h1 className="text-5xl font-bold subpixel-antialiased tracking-tight text-balance sm:text-7xl">
                            Speakle
                        </h1>
                        <p className="mt-8 text-lg font-medium text-muted-foreground sm:text-xl">
                            음악처럼 스며드는 영어학습. 듣고, 따라하고, 오래 남는 영어
                        </p>
                        {/* <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Button asChild size="lg" className="">
                                <Link to="/login" className="flex items-center">
                                    <LockClosedIcon className="h-6 w-6 mr-2" /> 로그인
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" className="">
                                <StarIcon className="h-6 w-6 mr-2" /> 더 알아보기
                            </Button>
                        </div> */}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
