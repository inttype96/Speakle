import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "react-router-dom"
import { useState } from "react"

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (confirmPassword && e.target.value !== confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.");
        } else {
            setError("");
        }
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
        if (password !== e.target.value) {
            setError("비밀번호가 일치하지 않습니다.");
        } else {
            setError("");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        if (password !== confirmPassword) {
            e.preventDefault();
            setError("비밀번호가 일치하지 않습니다.");
        }
        // other submit logic
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">회원가입</h1>
                                <p className="text-muted-foreground text-balance">
                                    Speakle에 오신 것을 환영합니다!
                                </p>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="name">이름</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="홍길동"
                                    required
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="email">이메일</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="example@example.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="password">비밀번호</Label>
                                <Input id="password" type="password" required value={password} onChange={handlePasswordChange} />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="confirm-password">비밀번호 확인</Label>
                                <Input id="confirm-password" type="password" required value={confirmPassword} onChange={handleConfirmPasswordChange} />
                                {error && <p className="text-sm text-destructive">{error}</p>}
                            </div>
                            <Button type="submit" className="w-full">
                                회원가입
                            </Button>
                            <div className="text-center text-sm">
                                이미 계정이 있으신가요?{" "}
                                <Link to="/login" className="underline underline-offset-4">
                                    로그인
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
