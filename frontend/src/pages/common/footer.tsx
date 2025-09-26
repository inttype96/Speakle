export default function Footer() {
    return (
        <footer className="border-t border-white/10 py-10 mt-10">
            <div className="mx-auto max-w-[1280px] px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm text-white/80">
                {/* Logo + 소개 */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl font-bold font-['Pretendard'] text-white">Speakle</span>
                    </div>
                    <p className="leading-relaxed font-['Pretendard']">
                        음악을 통해 영어를 배우는 혁신적인 학습 플랫폼입니다. 좋아하는 노래로 자연스럽게 영어 실력을 향상시켜보세요.
                    </p>
                </div>

                {/* 기술 스택 */}
                <div>
                    <h3 className="font-semibold mb-3 text-white font-['Pretendard']">기술 스택</h3>
                    <p className="text-white/90 mb-1 font-['Pretendard']">Frontend</p>
                    <ul className="list-disc ml-5 space-y-1 font-['Inter'] text-xs">
                        <li>React 18 + Vite</li>
                        <li>TypeScript</li>
                        <li>Tailwind CSS</li>
                        <li>Zustand</li>
                        <li>React Router v6</li>
                        <li>Axios</li>
                        <li>Sonner (Toast)</li>
                    </ul>
                    <p className="text-white/90 mt-3 mb-1 font-['Pretendard']">Backend</p>
                    <ul className="list-disc ml-5 space-y-1 font-['Inter'] text-xs">
                        <li>Spring Boot 3.3</li>
                        <li>Java 21</li>
                        <li>PostgreSQL</li>
                        <li>Spring Security + JWT</li>
                        <li>Spring Data JPA</li>
                        <li>Spotify Web API</li>
                        <li>Redis</li>
                    </ul>
                </div>

                {/* DevOps & AI */}
                <div>
                    <h3 className="font-semibold mb-3 text-white font-['Pretendard']">DevOps & AI</h3>
                    <p className="text-white/90 mb-1 font-['Pretendard']">Infrastructure</p>
                    <ul className="list-disc ml-5 space-y-1 font-['Inter'] text-xs">
                        <li>Docker & Docker Compose</li>
                        <li>Jenkins CI/CD</li>
                        <li>Nginx</li>
                        <li>GitLab</li>
                        <li>AWS EC2</li>
                    </ul>
                    <p className="text-white/90 mt-3 mb-1 font-['Pretendard']">AI/ML</p>
                    <ul className="list-disc ml-5 space-y-1 font-['Inter'] text-xs">
                        <li>Python FastAPI</li>
                        <li>Whisper AI (STT)</li>
                        <li>Hugging Face Models</li>
                        <li>LangChain</li>
                        <li>Sentence Transformers</li>
                    </ul>
                </div>

                {/* Team */}
                <div>
                    <h3 className="font-semibold mb-3 text-white font-['Pretendard']">Team SevenCode</h3>
                    <ul className="space-y-1 font-['Pretendard']">
                        <li>강성민</li>
                        <li>김소연</li>
                        <li>김아윤</li>
                        <li>임덕규</li>
                        <li>정수형</li>
                        <li>최승훈</li>
                        <li>하기환</li>
                    </ul>
                    <p className="text-xs text-white/50 mt-4 font-['Pretendard']">
                        © 2024 Speakle. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    )
}
