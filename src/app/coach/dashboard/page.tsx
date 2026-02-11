"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, auth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function CoachDashboard() {
    const { user, logout } = useAuth();
    const [members, setMembers] = useState<User[]>([]);
    const [newMemberCode, setNewMemberCode] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user?.id) {
            loadMembers();
        }
    }, [user]);

    const loadMembers = () => {
        if (user?.id) {
            setMembers(auth.getMembersByCoachId(user.id));
        }
    };

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        try {
            auth.linkMember(user.id, newMemberCode.trim());
            setNewMemberCode("");
            setIsAdding(false);
            loadMembers();
            alert("회원이 추가되었습니다.");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div style={{ padding: '24px', paddingBottom: '100px' }}>
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>회원 관리</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{members.length}명의 회원을 관리중입니다.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button size="s" variant="secondary" onClick={() => setIsAdding(!isAdding)}>
                        {isAdding ? '취소' : '추가'}
                    </Button>
                    <Button size="s" variant="ghost" onClick={logout} style={{ color: 'var(--color-text-secondary)' }}>
                        로그아웃
                    </Button>
                </div>
            </header>

            {isAdding && (
                <Card style={{ marginBottom: '24px' }}>
                    <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Input
                            label="회원 코드"
                            placeholder="회원 코드를 입력하세요"
                            value={newMemberCode}
                            onChange={(e) => setNewMemberCode(e.target.value)}
                            error={error}
                        />
                        <Button type="submit">등록하기</Button>
                    </form>
                </Card>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {members.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-tertiary)' }}>
                        관리중인 회원이 없습니다.<br />
                        회원 코드로 회원을 추가해보세요.
                    </div>
                ) : (
                    members.map(member => (
                        <Card key={member.id} className="member-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontWeight: '600', fontSize: '16px' }}>{member.name}</h3>
                                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>@{member.username}</span>
                                </div>
                                <Button size="s" variant="secondary" onClick={() => window.location.href = `/coach/member/${member.id}`}>관리</Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
