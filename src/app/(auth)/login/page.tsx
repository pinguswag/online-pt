"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(username);
        } catch (err: any) {
            setError(err.message || "로그인 실패");
        }
    };

    return (
        <div style={{ padding: '24px', paddingTop: '100px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Online PT</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>코치와 함께하는 건강한 변화</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Input
                        label="아이디"
                        placeholder="아이디를 입력해주세요"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        error={error}
                    />
                    <Button type="submit" size="l" variant="primary">
                        로그인
                    </Button>
                </form>
            </Card>

            <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                    계정이 없으신가요? <Link href="/signup" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>회원가입</Link>
                </p>
            </div>
        </div>
    );
}
