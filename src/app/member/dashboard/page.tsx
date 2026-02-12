"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { db, DailyLog, Plan, DailyPlan } from "@/lib/data";
import { gamification, Badge } from "@/lib/gamification";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { LevelProgress } from "@/components/gamification/LevelProgress";
import { BadgeList } from "@/components/gamification/BadgeList";

export default function MemberDashboard() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        streak: 0,
        level: { level: 1, title: '비기너' },
        nextLevelXp: 100,
        currentXp: 0,
        progress: 0
    });
    const [badges, setBadges] = useState<Badge[]>([]);

    // Date & Schedule State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
    const [dayCount, setDayCount] = useState<string>("-");

    const [allLogs, setAllLogs] = useState<DailyLog[]>([]);

    // Logging State
    const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
    const [routineChecked, setRoutineChecked] = useState(false);
    const [memoir, setMemoir] = useState("");
    const [dietImages, setDietImages] = useState<string[]>([]);

    // Helpers to refresh data
    const refreshData = async () => {
        if (!user?.id) return;

        try {
            const [logs, plan] = await Promise.all([
                db.getLogsByMemberId(user.id),
                db.getPlanByMemberId(user.id)
            ]);

            setAllLogs(logs); // Cache logs
            setCurrentPlan(plan);

            // Gamification
            const streak = gamification.calculateStreak(logs);
            const totalXp = logs.reduce((acc, log) => acc + 10 + (log.score || 0), 0);
            const levelInfo = gamification.calculateLevel(totalXp);
            const userBadges = gamification.getBadges(logs);

            setStats({
                streak,
                level: levelInfo.currentLevel,
                nextLevelXp: levelInfo.nextLevelXp,
                currentXp: totalXp,
                progress: levelInfo.progress
            });
            setBadges(userBadges);
        } catch (error) {
            console.error("Dashboard refresh error:", error);
        }
    };

    useEffect(() => {
        refreshData();
    }, [user]);

    // Optimize: Update daily view from cached logs when date changes
    useEffect(() => {
        const updateDailyView = async () => {
            if (user?.id && selectedDate) {
                // 1. Get Daily Plan (Network call - inevitable unless we cache plans too)
                const dPlan = await db.getDailyPlan(user.id, selectedDate);
                setDailyPlan(dPlan);

                // 2. Get Log from Cache (Instant)
                const log = allLogs.find(l => l.date === selectedDate);
                setTodayLog(log || null);
                setRoutineChecked(log ? log.routineChecked : false);
                setMemoir(log ? log.memoir : "");
                setDietImages(log ? (log.dietImages || []) : []);

                // Calculate Day Count
                if (currentPlan) {
                    const start = new Date(currentPlan.startDate);
                    const current = new Date(selectedDate);
                    const diffTime = current.getTime() - start.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                    // Total duration
                    const end = new Date(currentPlan.endDate);
                    const totalDiff = end.getTime() - start.getTime();
                    const totalDays = Math.ceil(totalDiff / (1000 * 60 * 60 * 24)) + 1;

                    if (diffDays > 0 && diffDays <= totalDays) {
                        setDayCount(`${diffDays}일차 / ${totalDays}일`);
                    } else if (diffDays <= 0) {
                        setDayCount("시작 전");
                    } else {
                        setDayCount("종료됨");
                    }
                } else {
                    setDayCount("플랜 없음");
                }
            }
        };
        updateDailyView();
    }, [user, selectedDate, currentPlan, allLogs]);

    const moveDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setDietImages([...dietImages, base64String]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (index: number) => {
        const newImages = [...dietImages];
        newImages.splice(index, 1);
        setDietImages(newImages);
    };

    const handleSaveLog = async () => {
        if (!user) return;

        const logData = {
            memberId: user.id,
            date: selectedDate,
            routineChecked,
            memoir,
            dietImages
        };

        try {
            if (todayLog) {
                await db.updateLog(todayLog.id, { routineChecked, memoir, dietImages });
            } else {
                await db.createLog(logData);
            }

            alert("오늘의 활동이 기록되었습니다! 🔥");
            refreshData();
            // Update local state is handled by refreshData for logs context, but we want immediate UI update for 'todayLog'
            const logs = await db.getLogsByMemberId(user.id);
            const newLog = logs.find(l => l.date === selectedDate);
            setTodayLog(newLog || null);
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    if (!user) return null;

    // Display Content: Daily Plan takes precedence, then Default Plan
    const displayDiet = dailyPlan?.dietGuide || currentPlan?.dietGuide || "등록된 식단이 없습니다.";
    const displayRoutine = dailyPlan?.routine || currentPlan?.routine || "등록된 루틴이 없습니다.";
    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    return (
        <div style={{ padding: '24px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>안녕하세요, {user.name}님</h1>
                    <div style={{ marginTop: '8px' }}>
                        <StreakCounter streak={stats.streak} />
                    </div>
                </div>
                <Button variant="ghost" size="s" onClick={logout} style={{ color: 'var(--color-text-secondary)' }}>
                    로그아웃
                </Button>
            </header>

            {/* Date Navigation & Day Count */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <button onClick={() => moveDate(-1)} style={{ padding: '8px', fontSize: '18px' }}>←</button>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-primary)' }}>{dayCount}</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedDate}</div>
                </div>
                <button onClick={() => moveDate(1)} style={{ padding: '8px', fontSize: '18px' }}>→</button>
            </div>

            {/* Mission & Logging Card */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: '600' }}>오늘의 미션 & 기록</h3>
                    {todayLog && <span style={{ fontSize: '12px', color: 'green', background: '#DCFCE7', padding: '4px 8px', borderRadius: '12px' }}>기록됨 ✅</span>}
                </div>

                {/* Diet Section */}
                <div style={{ marginBottom: '20px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>🍅 식단 가이드</span>
                    <div style={{ fontSize: '14px', background: '#F9FAFB', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                        {displayDiet}
                    </div>

                    {/* Diet Photos */}
                    <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>📸 식단 인증샷</span>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                            {dietImages.map((img, idx) => (
                                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                                    <img src={img} alt="diet" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                    <button
                                        onClick={() => handleRemoveImage(idx)}
                                        style={{ position: 'absolute', top: -4, right: -4, background: 'red', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                                    >
                                        x
                                    </button>
                                </div>
                            ))}

                            <label style={{ width: '80px', height: '80px', flexShrink: 0, border: '2px dashed var(--color-border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <span style={{ fontSize: '20px', color: 'var(--color-text-tertiary)' }}>+</span>
                                <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>사진 추가</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            </label>
                        </div>
                    </div>
                </div>

                <div style={{ width: '100%', height: '1px', background: 'var(--color-border)', marginBottom: '20px' }}></div>

                {/* Routine Section */}
                <div style={{ marginBottom: '20px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>💪 운동 루틴</span>
                    <div style={{ fontSize: '14px', background: '#F9FAFB', padding: '12px', borderRadius: '8px', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                        {displayRoutine}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: routineChecked ? '#EFF6FF' : 'white', padding: '12px', borderRadius: '8px', border: `1px solid ${routineChecked ? 'var(--color-primary)' : 'var(--color-border)'}` }}>
                        <input
                            type="checkbox"
                            checked={routineChecked}
                            onChange={(e) => setRoutineChecked(e.target.checked)}
                            style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ fontWeight: '600', color: routineChecked ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>
                            운동 루틴 완료!
                        </span>
                    </label>
                </div>

                <div style={{ width: '100%', height: '1px', background: 'var(--color-border)', marginBottom: '20px' }}></div>

                {/* Memoir Section */}
                <div style={{ marginBottom: '20px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>📝 오늘의 회고</span>
                    <textarea
                        style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', resize: 'none' }}
                        placeholder="오늘 운동은 어떠셨나요? 식단은 잘 지키셨나요?"
                        value={memoir}
                        onChange={(e) => setMemoir(e.target.value)}
                    />
                </div>

                <Button
                    size="l"
                    variant={todayLog ? "secondary" : "primary"}
                    onClick={handleSaveLog}
                    style={{ width: '100%' }}
                >
                    {todayLog ? "수정사항 저장하기" : "오늘 기록 완료하기"}
                </Button>
            </Card>

            {/* Level & Progress */}
            <LevelProgress
                currentLevel={stats.level}
                nextLevelXp={stats.nextLevelXp}
                currentXp={stats.currentXp}
                progress={stats.progress}
            />

            {/* Badges */}
            <BadgeList badges={badges} />

            {/* Coach Code Info */}
            <Card style={{ background: 'var(--color-surface)', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>나의 회원 코드: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{user.code}</span></p>
            </Card>
        </div>
    );
}
