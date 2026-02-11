"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserRole } from "@/lib/auth";
import Link from "next/link";

export default function SignupPage() {
    const { signup } = useAuth();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState<UserRole>("member");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !username) {
            setError("모든 필드를 입력해주세요.");
            return;
        }
        try {
            await signup({ name, username, role });
        } catch (err: any) {
            setError(err.message || "회원가입 실패");
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
                    label="이름"
                    placeholder="실명을 입력해주세요"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    label="아이디"
                    placeholder="사용할 아이디를 입력해주세요"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                {error && <p style={{ color: 'var(--color-danger)', fontSize: '14px' }}>{error}</p>}

                <Button type="submit" size="l" variant="primary" style={{ marginTop: '16px' }}>
                    가입하기
                </Button>
            </form>
        </div>
    );
}
