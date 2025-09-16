import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { signupAPI } from "@/services/auth"
import type { SignupReq } from "@/types/auth"
import { AxiosError } from "axios"

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<SignupReq>({
        email: '',
        password: '',
        username: ''
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password: string): boolean => {
        return password.length >= 8;
    };

    const handleInputChange = (field: keyof SignupReq) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear field-specific error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
        if (errors.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        const newErrors: Record<string, string> = {};

        if (!validateEmail(formData.email)) {
            newErrors.email = "이메일 형식이 올바르지 않습니다.";
        }

        if (!validatePassword(formData.password)) {
            newErrors.password = "비밀번호는 8자 이상이어야 합니다.";
        }

        if (formData.password !== confirmPassword) {
            newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
        }

        if (!formData.username.trim()) {
            newErrors.username = "이름을 입력해주세요.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await signupAPI(formData);

            if (response.data.status === 201) {
                alert("회원가입이 완료되었습니다.");
                navigate('/');
            }
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || "회원가입 중 오류가 발생했습니다.";

                switch (status) {
                    case 400:
                        if (message.includes("이메일")) {
                            setErrors({ email: message });
                        } else if (message.includes("비밀번호")) {
                            setErrors({ password: message });
                        } else {
                            alert(message);
                        }
                        break;
                    case 409:
                        alert(message);
                        break;
                    case 500:
                        alert(message);
                        break;
                    default:
                        alert("회원가입 중 오류가 발생했습니다.");
                }
            } else {
                alert("네트워크 오류가 발생했습니다.");
            }
        } finally {
            setIsLoading(false);
        }
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
                                <Label htmlFor="username">이름</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="김싸피"
                                    value={formData.username}
                                    onChange={handleInputChange('username')}
                                    disabled={isLoading}
                                    required
                                />
                                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="email">이메일</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange('email')}
                                    disabled={isLoading}
                                    required
                                />
                                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="password">비밀번호</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="8자 이상 입력하세요"
                                    value={formData.password}
                                    onChange={handleInputChange('password')}
                                    disabled={isLoading}
                                    required
                                />
                                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="confirm-password">비밀번호 확인</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="비밀번호를 다시 입력하세요"
                                    value={confirmPassword}
                                    onChange={handleConfirmPasswordChange}
                                    disabled={isLoading}
                                    required
                                />
                                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "가입 중..." : "회원가입"}
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
