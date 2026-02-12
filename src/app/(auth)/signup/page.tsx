"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserRole } from "@/lib/auth";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("member");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name || !email || !password) {
            setError("모든 필드를 입력해주세요.");
            return;
        }

        setIsLoading(true);
        try {
            // 1. Sign Up causing trigger to create profile
            const { data: { user }, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        nickname: name,
                        role: role
                    }
                }
            });

            if (signUpError) throw signUpError;

            // Note: If email confirmation is enabled, user session might be null here.
            // But the trigger runs on insert to auth.users, so profile is created regardless.

            alert("회원가입이 완료되었습니다! 이메일 확인 후 로그인해주세요.");
            router.push('/login');

        } catch (err: any) {
            console.error(err);
            setError(err.message || "회원가입 실패");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', paddingTop: '60px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <Link href="/login" style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px', display: 'inline-block' }}>← 로그인으로 돌아가기</Link>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>회원가입</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>서비스 이용을 위해 정보를 입력해주세요.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Role Selection */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        type="button"
                        variant={role === 'member' ? 'primary' : 'secondary'}
                        onClick={() => setRole('member')}
                        className="flex-1"
                    >
                        회원
                    </Button>
                    <Button
                        type="button"
                        variant={role === 'coach' ? 'primary' : 'secondary'}
                        onClick={() => setRole('coach')}
                        className="flex-1"
                    >
                        코치
                    </Button>
                </div>

                <Input
                    label="이름 (닉네임)"
                    placeholder="실명을 입력해주세요"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    label="이메일"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    label="비밀번호"
                    type="password"
                    placeholder="6자 이상 입력해주세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p style={{ color: 'var(--color-danger)', fontSize: '14px' }}>{error}</p>}

                <Button type="submit" size="l" variant="primary" style={{ marginTop: '16px' }} disabled={isLoading}>
                    {isLoading ? "가입 처리 중..." : "가입하기"}
                </Button>
            </form>
        </div>
    );
}
