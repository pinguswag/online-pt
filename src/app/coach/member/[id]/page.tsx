"use client";

import { useEffect, useState, use } from "react";
import { User } from "@/lib/auth";
import { db, Plan, DailyLog, DailyPlan } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

// Next.js 15+ Params are async
export default function CoachMemberDetail({ params }: { params: Promise<{ id: string }> }) {
    const [memberId, setMemberId] = useState<string>("");
    const [member, setMember] = useState<User | null>(null);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [dietGuide, setDietGuide] = useState("");
    const [routine, setRoutine] = useState("");
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
    const [dailyDiet, setDailyDiet] = useState("");
    const [dailyRoutine, setDailyRoutine] = useState("");

    useEffect(() => {
        // Unwrap params
        params.then(async (p) => {
            setMemberId(p.id);
            const u = await db.getUserById(p.id);
            if (u) setMember(u);

            const plan = await db.getPlanByMemberId(p.id);
            if (plan) setCurrentPlan(plan);

            const fetchedLogs = await db.getLogsByMemberId(p.id);
            setLogs(fetchedLogs.sort((a, b) => b.date.localeCompare(a.date)));
        });
    }, [params]);

    useEffect(() => {
        const loadDailyData = async () => {
            if (memberId && selectedDate) {
                const plan = await db.getDailyPlan(memberId, selectedDate);
                setDailyPlan(plan);
                setDailyDiet(plan?.dietGuide || "");
                setDailyRoutine(plan?.routine || "");
            }
        };
        loadDailyData();
    }, [memberId, selectedDate]);

    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberId || !member?.coachId) return;

        try {
            await db.createPlan({
                coachId: member.coachId,
                memberId: memberId,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 weeks default
                dietGuide,
                routine
            });

            alert("기본 플랜이 생성되었습니다.");
            // Refresh
            const plan = await db.getPlanByMemberId(memberId);
            if (plan) setCurrentPlan(plan);
            setDietGuide("");
            setRoutine("");
        } catch (error) {
            console.error(error);
            alert("플랜 생성 중 오류가 발생했습니다.");
        }
    };

    const handleSaveDaily = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberId) return;

        try {
            await db.createDailyPlan({
                memberId,
                date: selectedDate,
                dietGuide: dailyDiet,
                routine: dailyRoutine
            });

            alert(`${selectedDate}의 플랜이 저장되었습니다.`);
            // Refresh state
            const plan = await db.getDailyPlan(memberId, selectedDate);
            setDailyPlan(plan);
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    const [showDefaults, setShowDefaults] = useState(false);

    const handleLoadDefaultDiet = () => {
        if (currentPlan?.dietGuide) {
            setDailyDiet(currentPlan.dietGuide);
        } else {
            alert("설정된 기본 식단이 없습니다.");
        }
    };

    const handleLoadDefaultRoutine = () => {
        if (currentPlan?.routine) {
            setDailyRoutine(currentPlan.routine);
        } else {
            alert("설정된 기본 루틴이 없습니다.");
        }
    };

    if (!member) return <div style={{ padding: '24px' }}>Loading...</div>;

    const refreshLogs = async () => {
        const fetchedLogs = await db.getLogsByMemberId(memberId);
        setLogs(fetchedLogs.sort((a, b) => b.date.localeCompare(a.date)));
    };

    return (
        <div style={{ padding: '24px', paddingBottom: '100px' }}>
            <header style={{ marginBottom: '24px' }}>
                <Button size="sm" variant="ghost" onClick={() => router.back()} style={{ paddingLeft: 0, marginBottom: '8px' }}>
                    ← 뒤로가기
                </Button>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{member.name} 회원님</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <p style={{ color: 'var(--color-text-secondary)' }}>코칭 관리를 시작하세요.</p>
                    <Button size="sm" variant="secondary" onClick={() => router.push(`/coach/member/${memberId}/consultation`)}>
                        상담 정보 입력/조회
                    </Button>
                </div>
            </header>

            {/* Daily Management Section (Main Focus) */}
            <Card style={{ marginBottom: '24px', border: '2px solid var(--color-primary)' }}>
                <h3 style={{ fontWeight: '600', marginBottom: '16px', color: 'var(--color-primary)' }}>📅 일별 스케줄 관리</h3>

                <div style={{ marginBottom: '24px' }}>
                    <div>
    <label className="text-sm font-medium mb-1 block">날짜 선택</label>
    <Input
                        type="date"
                        
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
</div>
                </div>

                <form onSubmit={handleSaveDaily} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>
                                {selectedDate} 식단
                            </label>
                            <button
                                type="button"
                                onClick={handleLoadDefaultDiet}
                                style={{ fontSize: '12px', color: 'var(--color-primary)', background: '#EFF6FF', padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                            >
                                기본 식단 불러오기
                            </button>
                        </div>
                        <textarea
                            style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', resize: 'none' }}
                            placeholder="이 날의 특별한 식단을 입력하세요"
                            value={dailyDiet}
                            onChange={(e) => setDailyDiet(e.target.value)}
                        />
                    </div>

                    {/* Member's Log Display for Selected Date */}
                    {logs.find(l => l.date === selectedDate) && (
                        <div style={{ background: '#F0F9FF', padding: '16px', borderRadius: '12px', border: '1px solid #BAE6FD' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0369A1', marginBottom: '12px' }}>📝 회원의 기록 ({selectedDate})</h4>

                            {(() => {
                                const log = logs.find(l => l.date === selectedDate)!;
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {/* Routine Status */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0369A1' }}>운동 여부:</span>
                                            <span style={{ fontSize: '13px', color: log.routineChecked ? 'green' : 'red', fontWeight: 'bold' }}>
                                                {log.routineChecked ? '완료 ✅' : '미완료 ❌'}
                                            </span>
                                        </div>

                                        {/* Diet Photos */}
                                        {log.dietImages && log.dietImages.length > 0 ? (
                                            <div>
                                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0369A1', display: 'block', marginBottom: '4px' }}>식단 인증샷:</span>
                                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                                                    {log.dietImages.map((img, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={img}
                                                            alt={`diet-${idx}`}
                                                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #BAE6FD', background: 'white' }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '13px', color: '#64748B' }}>등록된 식단 사진이 없습니다.</p>
                                        )}

                                        {/* Memoir */}
                                        <div>
                                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0369A1', display: 'block', marginBottom: '4px' }}>회고:</span>
                                            <p style={{ fontSize: '13px', background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid #BAE6FD', whiteSpace: 'pre-wrap' }}>
                                                {log.memoir || "작성된 회고가 없습니다."}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500' }}>
                                {selectedDate} 운동
                            </label>
                            <button
                                type="button"
                                onClick={handleLoadDefaultRoutine}
                                style={{ fontSize: '12px', color: 'var(--color-primary)', background: '#EFF6FF', padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                            >
                                기본 루틴 불러오기
                            </button>
                        </div>
                        <textarea
                            style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', resize: 'none' }}
                            placeholder="이 날의 운동 루틴을 입력하세요"
                            value={dailyRoutine}
                            onChange={(e) => setDailyRoutine(e.target.value)}
                        />
                    </div>

                    <Button type="submit" variant="default">
                        {dailyPlan ? '일별 플랜 수정' : '일별 플랜 저장'}
                    </Button>
                </form>
            </Card>

            {/* Toggle Defaults Management */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <button
                    onClick={() => setShowDefaults(!showDefaults)}
                    style={{ fontSize: '14px', color: 'var(--color-text-secondary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    {showDefaults ? '🔽 기본 플랜 설정 숨기기' : '⚙️ 기본 플랜 설정 열기'}
                </button>
            </div>

            {/* Default Plan Section (Hidden by default) */}
            {showDefaults && (
                <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                    {/* Current Default Plan Display */}
                    {currentPlan ? (
                        <Card style={{ marginBottom: '24px', background: '#F9FAFB' }}>
                            <h3 style={{ fontWeight: '600', marginBottom: '12px' }}>기본 플랜 (Default)</h3>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                                {currentPlan.startDate} ~ {currentPlan.endDate}
                            </p>

                            <div style={{ marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>기본 식단</h4>
                                <div style={{ padding: '12px', background: 'white', borderRadius: '8px', fontSize: '14px', whiteSpace: 'pre-wrap', border: '1px solid var(--color-border)' }}>
                                    {currentPlan.dietGuide}
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>기본 루틴</h4>
                                <div style={{ padding: '12px', background: 'white', borderRadius: '8px', fontSize: '14px', whiteSpace: 'pre-wrap', border: '1px solid var(--color-border)' }}>
                                    {currentPlan.routine}
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card style={{ marginBottom: '24px', textAlign: 'center', padding: '32px', background: '#F9FAFB' }}>
                            <p style={{ color: 'var(--color-text-tertiary)' }}>설정된 기본 플랜이 없습니다.</p>
                        </Card>
                    )}

                    {/* Create New Default Plan Form */}
                    <Card style={{ background: '#F9FAFB' }}>
                        <h3 style={{ fontWeight: '600', marginBottom: '16px' }}>
                            {currentPlan ? '기본 플랜 수정' : '기본 플랜 만들기'}
                        </h3>
                        <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>기본 식단 가이드</label>
                                <textarea
                                    style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', resize: 'none' }}
                                    placeholder="4주간 적용될 기본 식단을 입력하세요..."
                                    value={dietGuide}
                                    onChange={(e) => setDietGuide(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>기본 운동 루틴</label>
                                <textarea
                                    style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', resize: 'none' }}
                                    placeholder="4주간 적용될 기본 루틴을 입력하세요..."
                                    value={routine}
                                    onChange={(e) => setRoutine(e.target.value)}
                                />
                            </div>

                            <Button type="submit" variant="secondary">
                                기본 플랜 저장하기
                            </Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* Logs & Feedback Section */}
            <h3 style={{ fontWeight: '600', marginBottom: '16px', marginTop: '32px' }}>활동 기록 및 피드백 (전체)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {logs.map(log => (
                    <LogItem key={log.id} log={log} onUpdate={refreshLogs} />
                ))}
                {logs.length === 0 && <p style={{ color: 'var(--color-text-tertiary)' }}>아직 활동 기록이 없습니다.</p>}
            </div>
        </div>
    );
}

function LogItem({ log, onUpdate }: { log: DailyLog, onUpdate: () => void }) {
    const [feedback, setFeedback] = useState(log.feedback || "");
    const [score, setScore] = useState(log.score || 5);
    const [isEditing, setIsEditing] = useState(!log.feedback);

    const handleSave = async () => {
        try {
            await db.updateLog(log.id, { feedback, score });
            setIsEditing(false);
            alert("피드백이 저장되었습니다.");
            onUpdate();
        } catch (error) {
            console.error(error);
            alert("피드백 저장 실패");
        }
    };

    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontWeight: '600' }}>{log.date}</h4>
                <span style={{ fontSize: '13px', color: log.routineChecked ? 'green' : 'red' }}>
                    {log.routineChecked ? '루틴 완료' : '루틴 미완료'}
                </span>
            </div>

            <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', marginBottom: '16px', background: '#F9FAFB', padding: '12px', borderRadius: '8px' }}>
                {log.memoir}
            </p>

            {/* Diet Photos */}
            {log.dietImages && log.dietImages.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>📸 식단 인증샷</p>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {log.dietImages.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt={`diet-${idx}`}
                                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                        placeholder="피드백을 남겨주세요"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>점수:</span>
                        <select
                            value={score}
                            onChange={(e) => setScore(Number(e.target.value))}
                            style={{ padding: '4px', borderRadius: '4px' }}
                        >
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}점</option>)}
                        </select>
                    </div>
                    <Button size="sm" onClick={handleSave}>저장</Button>
                </div>
            ) : (
                <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '8px' }}>
                    <p style={{ fontSize: '13px', color: '#1E40AF', fontWeight: '600' }}>피드백 ({log.score}점)</p>
                    <p style={{ fontSize: '14px', marginTop: '4px' }}>{log.feedback}</p>
                    <button
                        style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px', textDecoration: 'underline' }}
                        onClick={() => setIsEditing(true)}
                    >
                        수정하기
                    </button>
                </div>
            )}
        </Card>
    );
}
