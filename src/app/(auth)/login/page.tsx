"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
// import { supabase } from "@/lib/supabase"; // Removed direct usage
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("이메일과 비밀번호를 입력해주세요.");
            return;
        }

        setIsLoading(true);
        try {
            console.log("[Login] Attempting login for:", email);
            const user = await login(email, password);

            if (user) {
                console.log("[Login] Success, role:", user.role);
                if (user.role === 'coach') {
                    router.push('/coach/dashboard');
                } else {
                    router.push('/member/dashboard');
                }
            } else {
                throw new Error("로그인 성공했으나 프로필 정보를 불러올 수 없습니다.");
            }

        } catch (err: any) {
            console.error("[Login] Exception:", err);
            // Handle specific Supabase errors if needed
            if (err.message && err.message.includes("Invalid login")) {
                setError("이메일 또는 비밀번호가 일치하지 않습니다.");
            } else {
                setError(err.message || "로그인 중 오류가 발생했습니다.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', paddingTop: '100px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '8px' }}>Online PT</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>나만의 온라인 퍼스널 트레이너</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    placeholder="비밀번호를 입력해주세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p style={{ color: 'var(--color-danger)', fontSize: '14px' }}>{error}</p>}

                <Button type="submit" size="l" variant="primary" style={{ marginTop: '16px' }} disabled={isLoading}>
                    {isLoading ? "로그인 중..." : "로그인"}
                </Button>
            </form>

            <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>계정이 없으신가요? </span>
                <Link href="/signup" style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: '600' }}>
                    회원가입하기
                </Link>
            </div>
        </div>
    );
}
