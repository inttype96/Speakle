import Navbar from "@/components/common/navbar"
import Footer from "./footer"
import SplashCursor from '@/lib/splashCursor'
import Plasma from '@/lib/plasma';


export default function IndexPage() {
    return (
        <div className="bg-background text-foreground">
            <SplashCursor />
            <Navbar />
            <Plasma
                color="#b431e0ce"
                speed={0.6}
                direction="forward"
                scale={1.1}
                opacity={0.8}
                mouseInteractive={true}
            />
            {/* Hero Section */}
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold subpixel-antialiased tracking-tight text-balance sm:text-7xl">
                            Speakle
                        </h1>
                        <p className="mt-8 text-lg font-medium text-muted-foreground sm:text-xl">
                            음악처럼 스며드는 영어학습. 듣고, 따라하고, 오래 남는 영어
                        </p>
                    </div>
                </div>
                <Footer />
            </div>
        </div>
    )
}
