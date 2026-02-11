"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, Plan, DailyLog } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";

export default function DailyPage({ params }: { params: Promise<{ date: string }> }) {
    const { user } = useAuth();
    const router = useRouter();

    const [date, setDate] = useState("");
    const [plan, setPlan] = useState<Plan | null>(null);
    const [log, setLog] = useState<DailyLog | null>(null);

    // Form State
    const [routineChecked, setRoutineChecked] = useState(false);
    const [memoir, setMemoir] = useState("");
    const [dietImageCount, setDietImageCount] = useState(0); // Mock

    useEffect(() => {
        params.then(p_params => { // Renamed 'p' to 'urlParams' to avoid shadowing
            setDate(p_params.date);
            if (user?.id) {
                // Get Plan
                const memberPlan = db.getPlanByMemberId(user.id); // Renamed 'p' to 'memberPlan'
                if (memberPlan) {
                    setPlan(memberPlan);
                }

                // Get Log
                const logs = db.getLogsByMemberId(user.id);
                // Use the date from URL params
                const todayLog = logs.find(l => l.date === p_params.date);
                if (todayLog) {
                    setLog(todayLog);
                    setRoutineChecked(todayLog.routineChecked);
                    setMemoir(todayLog.memoir);
                    setDietImageCount(todayLog.dietImages.length);
                }
            }
        });
    }, [params, user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id || !date) return;

        if (log) {
            alert("이미 제출된 기록입니다.");
            return;
        }

        db.createLog({
            memberId: user.id,
            date: date,
            dietImages: Array(dietImageCount).fill("mock-url"),
            routineChecked,
            memoir
        });

        alert("오늘의 기록이 저장되었습니다!");
        router.refresh(); // Or reload state
        // Ideally reload data
        const logs = db.getLogsByMemberId(user.id);
        const todayLog = logs.find(l => l.date === date);
        if (todayLog) setLog(todayLog);
    };

    if (!date) return <div>Loading...</div>;

    return (
        <div style={{ padding: '24px', paddingBottom: '100px' }}>
            <header style={{ marginBottom: '24px' }}>
                <Button size="s" variant="ghost" onClick={() => router.push('/member/dashboard')} style={{ paddingLeft: 0, marginBottom: '8px' }}>
                    ← 홈으로
                </Button>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{date}</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>오늘의 미션과 기록</p>
            </header>

            {/* Plan View */}
            <Card style={{ marginBottom: '24px' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>오늘의 미션</h3>
                {plan ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>DIET</span>
                            <p style={{ fontSize: '15px' }}>{plan.dietGuide}</p>
                        </div>
                        <div style={{ height: '1px', background: 'var(--color-border)' }} />
                        <div>
                            <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>ROUTINE</span>
                            <p style={{ fontSize: '15px' }}>{plan.routine}</p>
                        </div>
                    </div>
                ) : (
                    <p style={{ color: 'var(--color-text-tertiary)' }}>등록된 플랜이 없습니다.</p>
                )}
            </Card>

            {/* Log Form */}
            <Card>
                <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>활동 기록</h3>
                {log ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ padding: '12px', background: '#F0FFF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                            <span style={{ color: '#166534', fontWeight: '600', fontSize: '14px' }}>✅ 제출 완료</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', marginBottom: '4px', fontWeight: '500' }}>나의 메모</p>
                            <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>{log.memoir}</p>
                        </div>
                        {log.feedback && (
                            <div style={{ marginTop: '12px', padding: '12px', background: '#EFF6FF', borderRadius: '8px' }}>
                                <p style={{ fontSize: '13px', color: '#1E40AF', fontWeight: '600' }}>코치님 피드백</p>
                                <p style={{ fontSize: '14px', marginTop: '4px' }}>{log.feedback}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Routine Check */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={routineChecked}
                                onChange={(e) => setRoutineChecked(e.target.checked)}
                                style={{ width: '20px', height: '20px' }}
                            />
                            <span style={{ fontSize: '16px' }}>운동 루틴 완료</span>
                        </label>

                        {/* Diet Image Mock */}
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>식단 사진 (최대 5장)</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button type="button" size="s" variant="secondary" onClick={() => setDietImageCount(Math.min(5, dietImageCount + 1))}>
                                    사진 추가 ({dietImageCount}/5)
                                </Button>
                                {dietImageCount > 0 && (
                                    <Button type="button" size="s" variant="ghost" onClick={() => setDietImageCount(0)}>초기화</Button>
                                )}
                            </div>
                        </div>

                        {/* Memoir */}
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>오늘의 느낀점</p>
                            <textarea
                                style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', resize: 'none', fontFamily: 'inherit' }}
                                placeholder="오늘 하루는 어땠나요?"
                                value={memoir}
                                onChange={(e) => setMemoir(e.target.value)}
                            />
                        </div>

                        <Button type="submit" variant="primary" size="l">
                            기록 제출하기
                        </Button>
                    </form>
                )}
            </Card>
        </div>
    );
}
