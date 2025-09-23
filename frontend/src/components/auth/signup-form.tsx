import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { signupAPI, loginAPI, sendEmailVerificationAPI, verifyEmailCodeAPI } from "@/services/auth"
import type { SignupReq } from "@/types/auth"
import { AxiosError } from "axios"
import { useAuthStore } from "@/store/auth"
import HeadphoneImage from '@/assets/images/headset2.png'

export function SignupForm() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [formData, setFormData] = useState<SignupReq>({
        email: '',
        password: '',
        username: ''
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);

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

    const handleSendVerificationCode = async () => {
        if (!validateEmail(formData.email)) {
            setErrors(prev => ({ ...prev, email: "이메일 형식이 올바르지 않습니다." }));
            return;
        }

        setIsSendingCode(true);
        try {
            await sendEmailVerificationAPI(formData.email);
            setIsCodeSent(true);
            alert('인증 코드가 이메일로 발송되었습니다.');
        } catch (error) {
            if (error instanceof AxiosError) {
                alert(error.response?.data?.message || '인증 코드 발송에 실패했습니다.');
            }
        } finally {
            setIsSendingCode(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode) {
            setErrors(prev => ({ ...prev, verificationCode: "인증 코드를 입력해주세요." }));
            return;
        }

        setIsVerifyingCode(true);
        try {
            await verifyEmailCodeAPI(formData.email, verificationCode);
            setIsEmailVerified(true);
            alert('이메일 인증이 완료되었습니다!');
        } catch (error) {
            if (error instanceof AxiosError) {
                setErrors(prev => ({ ...prev, verificationCode: error.response?.data?.message || '인증 코드가 올바르지 않습니다.' }));
            }
        } finally {
            setIsVerifyingCode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};

        if (!isEmailVerified) {
            newErrors.email = "이메일 인증을 완료해주세요.";
        }

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

            if (response.status === 201 || response.data?.status === 201) {
                alert("회원가입이 완료되었습니다.");

                try {
                    const loginResponse = await loginAPI({
                        email: formData.email,
                        password: formData.password
                    });

                    if (loginResponse.status === 200) {
                        const tokens = loginResponse.data.data;
                        login(tokens);
                    }
                } catch (loginError) {
                    // 자동 로그인 실패해도 회원가입은 성공
                }

                navigate('/spotify-setup');
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
        <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-0 bg-background rounded-2xl overflow-hidden shadow-2xl">
            {/* 왼쪽: Speakle 로고 섹션 */}
            <div className="p-12 flex flex-col items-center justify-center text-white" style={{ backgroundColor: '#3F2176' }}>
                <div className="relative mb-8">
                    <img
                        src={HeadphoneImage}
                        alt="Headset"
                        className="w-64 h-64 object-contain mx-auto"
                    />
                    <h1 className="absolute inset-0 flex items-center justify-center text-6xl font-extrabold font-poppins text-white">
                        Speakle
                    </h1>
                </div>
                <p className="text-center text-xl leading-relaxed text-gray-300">
                    음악처럼 스며드는 영어학습 <br />
                    듣고, 따라하고, 오래 남는 영어
                </p>
            </div>

            {/* 오른쪽: 회원가입 폼 */}
            <div className="p-8 md:p-12">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">회원가입</h1>
                        <p className="text-muted-foreground">
                            Speakle에 오신 것을 환영합니다!
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <Label htmlFor="username" className="text-base w-20 shrink-0">이름</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="김싸피"
                                value={formData.username}
                                onChange={handleInputChange('username')}
                                disabled={isLoading}
                                className="h-12 flex-1"
                                required
                            />
                        </div>
                        {errors.username && <p className="text-sm text-destructive ml-24">{errors.username}</p>}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <Label htmlFor="email" className="text-base w-20 shrink-0">이메일</Label>
                            <div className="flex gap-2 flex-1">
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange('email')}
                                    disabled={isLoading || isEmailVerified}
                                    className="h-12 flex-1"
                                    required
                                />
                                <Button
                                    type="button"
                                    onClick={handleSendVerificationCode}
                                    disabled={isSendingCode || isEmailVerified || !formData.email}
                                    className="bg-[#4B2199] hover:bg-[#7070BA] h-12 px-6 whitespace-nowrap"
                                >
                                    {isEmailVerified ? '인증완료' : isSendingCode ? '발송중...' : '인증하기'}
                                </Button>
                            </div>
                        </div>
                        {errors.email && <p className="text-sm text-destructive ml-24">{errors.email}</p>}
                    </div>

                    {isCodeSent && !isEmailVerified && (
                        <div className="space-y-2">
                            <Label htmlFor="verificationCode" className="text-base">인증 코드</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="verificationCode"
                                    type="text"
                                    placeholder="인증 코드 6자리"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    disabled={isVerifyingCode}
                                    className="h-12 flex-1"
                                    maxLength={6}
                                />
                                <Button
                                    type="button"
                                    onClick={handleVerifyCode}
                                    disabled={isVerifyingCode || !verificationCode}
                                    className="bg-[#B5A6E0] hover:bg-[#7070BA] text-black h-12 px-6"
                                >
                                    {isVerifyingCode ? '확인중...' : '확인'}
                                </Button>
                            </div>
                            {errors.verificationCode && <p className="text-sm text-destructive">{errors.verificationCode}</p>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-base">비밀번호</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="8자 이상 입력하세요"
                            value={formData.password}
                            onChange={handleInputChange('password')}
                            disabled={isLoading}
                            className="h-12"
                            required
                        />
                        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-base">비밀번호 확인</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="비밀번호를 다시 입력하세요"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            disabled={isLoading}
                            className="h-12"
                            required
                        />
                        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-lg bg-[#4B2199] hover:bg-[#7070BA]"
                        disabled={isLoading || !isEmailVerified}
                    >
                        {isLoading ? "가입 중..." : "회원가입"}
                    </Button>

                    <div className="text-center text-sm">
                        이미 계정이 있으신가요?{" "}
                        <Link to="/login" className="text-[#4B2199] hover:text-[#7070BA] font-medium underline-offset-4 hover:underline">
                            로그인
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}