import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useState } from "react"
import { useAuthStore } from "@/store/auth"
import { loginAPI, getUserProfileAPI } from "@/services/auth"

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, setUserId } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await loginAPI({ email, password });
            console.log('Login response:', response);
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);

            if (response.status === 200) {
                const tokens = response.data.data;
                console.log('Tokens to save:', tokens);

                // 토큰 저장
                login(tokens);
                console.log('토큰 저장 완료, 저장된 토큰:', tokens);

                // 토큰이 확실히 저장될 때까지 잠시 대기
                await new Promise(resolve => setTimeout(resolve, 100));

                try {
                    // 사용자 프로필 조회하여 userId 저장
                    console.log('프로필 API 호출 시작...');
                    const profileResponse = await getUserProfileAPI();
                    console.log('프로필 API 응답:', profileResponse);

                    const profileData = profileResponse.data?.data || profileResponse.data;
                    console.log('추출된 프로필 데이터:', profileData);

                    if (profileData?.userId) {
                        console.log('userId 저장 시도:', profileData.userId);
                        setUserId(profileData.userId);

                        // persist 저장이 완료될 때까지 잠시 대기
                        await new Promise(resolve => setTimeout(resolve, 200));

                        console.log('setUserId 호출 후 - zustand 상태:', useAuthStore.getState());

                        // localStorage에 직접 확인
                        const stored = localStorage.getItem('auth-storage');
                        console.log('localStorage auth-storage:', stored);

                        // 파싱해서 userId 확인
                        if (stored) {
                            const parsedStorage = JSON.parse(stored);
                            console.log('파싱된 localStorage:', parsedStorage);
                            console.log('localStorage의 userId:', parsedStorage.state?.userId);
                        }
                    } else {
                        console.error('profileData에 userId가 없음:', profileData);
                    }
                } catch (profileErr) {
                    console.error('프로필 조회 실패:', profileErr);
                    // 프로필 조회 실패해도 로그인은 성공으로 처리
                }

                console.log('After login - auth state:', useAuthStore.getState());

                // redirect 파라미터가 있으면 해당 경로로, 없으면 메인 페이지로
                const redirectTo = searchParams.get('redirect') || '/';
                navigate(redirectTo);
            }
        } catch (err: any) {
            if (err.response) {
                setError(err.response.data.message);
            } else {
                setError('An unexpected error occurred.');
            }
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">환영합니다!</h1>
                                <p className="text-muted-foreground text-balance">
                                    Speakle을 이용하시려면 로그인 해 주세요.
                                </p>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="email">이메일</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="example@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password">비밀번호</Label>
                                    <a
                                        href="#"
                                        className="ml-auto text-sm underline-offset-2 hover:underline"
                                    >
                                        비밀번호를 잊으셨나요?
                                    </a>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <Button type="submit" className="w-full">
                                로그인
                            </Button>
                            <div className="text-center text-sm">
                                계정이 없으신가요?{" "}
                                <Link to="/signup" className="underline underline-offset-4">
                                    회원가입
                                </Link>
                            </div>
                        </div>
                    </form>
                    <div className="bg-muted relative hidden md:block">
                        <img
                            src="/placeholder.svg"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
