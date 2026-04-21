"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, DailyLog, Plan, DailyPlan, Workout, NutritionData } from "@/lib/data";
import { gamification, Badge } from "@/lib/gamification";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { LevelProgress } from "@/components/gamification/LevelProgress";
import { BadgeList } from "@/components/gamification/BadgeList";
import { WorkoutLogger } from "@/components/daily/WorkoutLogger";
import { NutritionCard } from "@/components/daily/NutritionCard";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis } from "recharts";
import { Flame, CheckCircle2, TrendingUp, ChevronLeft, ChevronRight, Home, Dumbbell, Utensils, FileText, Share2 } from "lucide-react";
import { toBlob, toPng } from "html-to-image";

type TabType = "home" | "workout" | "nutrition" | "report";

export default function MemberDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("home");
    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    
    // Gamification & Overall Stats
    const [stats, setStats] = useState({
        streak: 0,
        level: { level: 1, title: '비기너' },
        nextLevelXp: 100,
        currentXp: 0,
        progress: 0
    });
    const [badges, setBadges] = useState<Badge[]>([]);
    
    // Daily Log State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
    const [dayCount, setDayCount] = useState<string>("-");
    const [allLogs, setAllLogs] = useState<DailyLog[]>([]);

    const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [nutrition, setNutrition] = useState<NutritionData>({});
    const [todayWeight, setTodayWeight] = useState<number | "">("");
    const [memoir, setMemoir] = useState("");

    const refreshData = async () => {
        if (!user?.id) return;
        try {
            const [logs, plan] = await Promise.all([
                db.getLogsByMemberId(user.id),
                db.getPlanByMemberId(user.id)
            ]);
            setAllLogs(logs);
            setCurrentPlan(plan);
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

    useEffect(() => { refreshData(); }, [user]);

    useEffect(() => {
        const updateDailyView = async () => {
            if (user?.id && selectedDate) {
                const dPlan = await db.getDailyPlan(user.id, selectedDate);
                setDailyPlan(dPlan);
                const log = allLogs.find(l => l.date === selectedDate);
                setTodayLog(log || null);
                setWorkouts(log?.workouts || []);
                setNutrition(log?.nutrition || {});
                setMemoir(log?.memoir || "");
                setTodayWeight(log?.weight || "");

                if (currentPlan) {
                    const start = new Date(currentPlan.startDate);
                    const current = new Date(selectedDate);
                    const diffDays = Math.ceil((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    const end = new Date(currentPlan.endDate);
                    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    if (diffDays > 0 && diffDays <= totalDays) setDayCount(`${diffDays}일차 / ${totalDays}일`);
                    else setDayCount(diffDays <= 0 ? "시작 전" : "종료됨");
                } else setDayCount("플랜 없음");
            }
        };
        updateDailyView();
    }, [user, selectedDate, currentPlan, allLogs]);

    const moveDate = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const handleSaveLog = async () => {
        if (!user) return;
        const logData = {
            memberId: user.id,
            date: selectedDate,
            routineChecked: false, // Legacy
            dietImages: [], // Legacy
            memoir,
            workouts,
            nutrition,
            weight: Number(todayWeight) || undefined
        };
        try {
            if (todayLog) await db.updateLog(todayLog.id, logData);
            else await db.createLog(logData as unknown as Omit<DailyLog, "id">);
            alert("오늘의 활동이 기록되었습니다! 🔥");
            refreshData();
        } catch (error) {
            console.error(error);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    const handleExportImage = async () => {
        if (!exportRef.current) return;
        try {
            setIsExporting(true);
            const blob = await toBlob(exportRef.current, {
                backgroundColor: "#09090b",
                pixelRatio: 2,
            });
            if (!blob) throw new Error("이미지 생성에 실패했습니다.");
            
            const file = new File([blob], `OUNWAN_${selectedDate}.png`, { type: "image/png" });
            
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: "오운완 기록",
                        text: "오늘도 완벽한 하루! 제 기록을 확인해보세요 🔥",
                        files: [file]
                    });
                } catch (err: any) {
                    if (err.name !== "AbortError") {
                        // Fallback download if sharing fails explicitly
                        downloadFallback(exportRef.current!);
                    }
                }
            } else {
                downloadFallback(exportRef.current!);
            }
        } catch (error) {
            console.error("Image export failed", error);
            alert("이미지 저장 및 공유에 실패했습니다.");
        } finally {
            setIsExporting(false);
        }
    };

    const downloadFallback = async (element: HTMLElement) => {
        try {
            const image = await toPng(element, { backgroundColor: "#09090b", pixelRatio: 2 });
            const a = document.createElement("a");
            a.href = image;
            a.download = `OUNWAN_${selectedDate}.png`;
            a.click();
        } catch (e) {
            console.error("Fallback download failed", e);
        }
    };

    // Calculate Summary Status
    const summary = useMemo(() => {
        let completedSets = 0;
        let totalSets = 0;
        workouts.forEach(w => w.sets.forEach(s => {
            totalSets++;
            if (s.isCompleted) completedSets++;
        }));
        const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;
        
        let totalCals = 0;
        Object.values(nutrition).forEach(m => {
            if (m) {
                totalCals += (Number(m.carbs || 0) * 4) + (Number(m.protein || 0) * 4) + (Number(m.fat || 0) * 9);
            }
        });
        
        return { progress, calories: totalCals };
    }, [workouts, nutrition]);

    // Weight Chart Data
    const chartData = useMemo(() => {
        const sortedLogs = [...allLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const valid = sortedLogs.filter(l => l.weight !== undefined && l.weight !== null);
        return valid.slice(-7).map(l => ({
            date: l.date.slice(5),
            weight: l.weight
        }));
    }, [allLogs]);

    if (!user) return null;

    // ----- Tab Rendering Logic -----
    const renderHomeTab = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md border-0">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white/80 text-sm font-medium">운동 진행률</span>
                            <CheckCircle2 className="w-5 h-5 text-white/50" />
                        </div>
                        <div className="text-3xl font-bold">{summary.progress}%</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md border-0">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white/80 text-sm font-medium">총 소모/섭취</span>
                            <Flame className="w-5 h-5 text-white/50" />
                        </div>
                        <div className="text-3xl font-bold">{summary.calories} <span className="text-lg font-normal opacity-80">kcal</span></div>
                    </CardContent>
                </Card>
            </div>

            {/* Level & Gamification */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-bold mb-3">🎮 나의 성장 지표</h2>
                    <LevelProgress
                        currentLevel={stats.level}
                        nextLevelXp={stats.nextLevelXp}
                        currentXp={stats.currentXp}
                        progress={stats.progress}
                    />
                </div>
                <div>
                    <h2 className="text-lg font-bold mb-3">🏅 획득한 뱃지</h2>
                    <BadgeList badges={badges} />
                </div>
            </div>
            
            <div className="text-center pt-4 pb-8">
                <p className="text-xs text-muted-foreground">나의 회원 코드: <span className="font-mono font-bold text-primary">{user.code}</span></p>
            </div>
        </div>
    );

    const todayRoutine = dailyPlan?.routine || currentPlan?.routine || "";

    const renderWorkoutTab = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    💪 오늘의 운동 <span className="text-muted-foreground text-sm font-normal">Today's Workout</span>
                </h2>
                
                {todayRoutine && (
                    <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-primary text-sm font-bold">🎯 코치님의 추천 루틴</span>
                        </div>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{todayRoutine}</p>
                    </div>
                )}

                <WorkoutLogger workouts={workouts} onChange={setWorkouts} />
            </div>
        </div>
    );

    const todayDietGuide = dailyPlan?.dietGuide || currentPlan?.dietGuide || "";

    const renderNutritionTab = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    🥗 식단 기록 <span className="text-muted-foreground text-sm font-normal">Nutrition</span>
                </h2>

                {todayDietGuide && (
                    <div className="mb-4 p-4 bg-green-500/5 border border-green-500/20 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-600 text-sm font-bold">🎯 코치님의 추천 식단</span>
                        </div>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{todayDietGuide}</p>
                    </div>
                )}

                <NutritionCard nutrition={nutrition} onChange={setNutrition} />
            </div>
        </div>
    );

    const renderReportTab = () => (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                📊 오늘의 기록 <span className="text-muted-foreground text-sm font-normal">Daily Report</span>
            </h2>
            
            {/* Weight Tracker */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        체중 기록 및 변화 (7일)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                        <Input 
                            type="number" 
                            placeholder="오늘 체중을 입력하세요 (kg)" 
                            value={todayWeight} 
                            onChange={e => setTodayWeight(e.target.value ? Number(e.target.value) : "")}
                            className="h-11"
                        />
                        <span className="text-sm font-medium text-muted-foreground shrink-0 w-6">kg</span>
                    </div>
                    {chartData.length > 0 ? (
                        <div className="h-40 w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3182F6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3182F6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis domain={['auto', 'auto']} fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="weight" stroke="#3182F6" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-40 w-full flex items-center justify-center text-sm text-muted-foreground bg-muted/30 rounded-xl mt-4">
                            기록된 체중 데이터가 없습니다.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Memoir */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        오늘 하루 회고
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <textarea
                        className="w-full h-32 p-4 rounded-xl border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                        placeholder="오늘 운동은 어떠셨나요? 힘들었던 점이나 성취감을 자유롭게 적어보세요."
                        value={memoir}
                        onChange={(e) => setMemoir(e.target.value)}
                    />
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="py-4 flex flex-col gap-3">
                <Button 
                    size="lg" 
                    onClick={handleSaveLog} 
                    className="w-full shadow-lg shadow-primary/25 h-14 rounded-xl text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {todayLog ? "오늘 기록 수정 완료하기" : "오늘 하루 기록 제출하기!"}
                </Button>
                <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleExportImage} 
                    disabled={isExporting}
                    className="w-full shadow-sm h-14 rounded-xl text-sm font-semibold border-primary/20 text-primary hover:bg-primary/5"
                >
                    {isExporting ? "캡처 중..." : <><Share2 className="w-4 h-4 mr-2" /> 기록 공유하기</>}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="max-w-md mx-auto bg-background min-h-[100dvh] flex flex-col relative pb-[80px]">
            
            {/* Hidden Container for HQ Image Export */}
            <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none">
                <div 
                    ref={exportRef} 
                    className="w-[420px] bg-zinc-950 text-zinc-50 flex flex-col items-center justify-start p-8 rounded-3xl overflow-hidden"
                >
                {/* Header */}
                <div className="w-full flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-white mb-1.5">{user.name} 님의 오운완 🔥</h2>
                        <p className="text-sm text-zinc-400 font-medium tracking-wide">{selectedDate}</p>
                    </div>
                </div>

                {/* Workout Progress */}
                <div className="w-full bg-zinc-900 rounded-2xl p-6 mb-5 border border-zinc-800 shadow-xl">
                    <h3 className="text-base font-bold text-zinc-300 mb-4 flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-primary"/> 운동 달성률
                    </h3>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-4xl font-black text-white">{summary.progress}%</p>
                        </div>
                        {todayWeight && (
                            <div className="text-right">
                                <p className="text-xs text-zinc-500 mb-1">체중</p>
                                <p className="text-xl font-bold text-white">{todayWeight} kg</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Workout List (Detailed) */}
                {workouts.length > 0 && (
                    <div className="w-full bg-zinc-900 rounded-2xl p-6 mb-5 border border-zinc-800 shadow-xl">
                        <h3 className="text-base font-bold text-zinc-300 mb-4 flex items-center gap-2">
                            <Dumbbell className="w-5 h-5 text-primary"/> 오늘 수행한 운동
                        </h3>
                        <div className="space-y-3">
                            {workouts.map((w, idx) => {
                                const completeSets = w.sets.filter(s => s.isCompleted);
                                return (
                                    <div key={idx} className="flex flex-col gap-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800/50">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-white text-sm">{w.name}</span>
                                            <span className="text-xs font-semibold text-primary/80 bg-primary/10 px-2 py-1 rounded-md">{completeSets.length} / {w.sets.length}세트</span>
                                        </div>
                                        {completeSets.length > 0 && (
                                            <div className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                                                {completeSets.map((s) => `${s.weight}kg x ${s.reps}회`).join(", ")}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Nutrition Progress Summary */}
                <div className="w-full bg-zinc-900 rounded-2xl p-6 mb-5 border border-zinc-800 shadow-xl">
                    <h3 className="text-base font-bold text-zinc-300 mb-4 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-green-500"/> 총 섭취 칼로리
                    </h3>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-4xl font-black text-white">{summary.calories} <span className="text-xl font-normal text-zinc-500">kcal</span></p>
                        </div>
                    </div>
                </div>

                {/* Nutrition Detail List */}
                {Object.keys(nutrition).length > 0 && (
                    <div className="w-full bg-zinc-900 rounded-2xl p-6 mb-5 border border-zinc-800 shadow-xl">
                        <h3 className="text-base font-bold text-zinc-300 mb-4 flex items-center gap-2">
                            <Utensils className="w-5 h-5 text-green-500"/> 상세 식단 기록
                        </h3>
                        <div className="gap-3 grid grid-cols-2">
                            {Object.entries(nutrition).map(([mealName, data]) => {
                                const mealMap: Record<string, string> = { breakfast: '아침', lunch: '점심', dinner: '저녁', snack: '간식' };
                                if (!data) return null;
                                const cal = (data.carbs * 4) + (data.protein * 4) + (data.fat * 9);
                                return (
                                    <div key={mealName} className="bg-zinc-950 p-4 rounded-xl flex flex-col justify-between border border-zinc-800/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-zinc-400 font-bold">{mealMap[mealName] || mealName}</span>
                                            <span className="text-sm font-black text-white">{cal} kcal</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-zinc-500 font-medium tracking-tight">
                                            <span>탄 {data.carbs}g</span>
                                            <span>단 {data.protein}g</span>
                                            <span>지 {data.fat}g</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Memoir */}
                {memoir && (
                    <div className="w-full bg-zinc-900 rounded-2xl p-6 mb-8 border border-zinc-800 shadow-xl">
                        <h3 className="text-base font-bold text-zinc-300 mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500"/> 오늘의 회고
                        </h3>
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{memoir}</p>
                    </div>
                )}
                
                {/* Footer Brand */}
                <div className="w-full text-center mt-4">
                    <p className="text-xs font-bold text-zinc-600 tracking-[0.3em]">ONLINE PT SYSTEM</p>
                </div>
            </div>
            </div>

            {/* Header Area (Always Visible) */}
            <header className="p-4 md:px-6 pt-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">안녕하세요, {user.name}님!</h1>
                        <div className="mt-1.5 text-sm text-muted-foreground">
                            <StreakCounter streak={stats.streak} />
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={logout} className="text-xs h-8 rounded-full border-muted-foreground/30">
                        로그아웃
                    </Button>
                </div>

                {/* Common Date Navigator */}
                <div className="flex items-center justify-between bg-card text-card-foreground p-2 px-3 rounded-full shadow-sm border border-border/60">
                    <Button variant="ghost" size="icon" onClick={() => moveDate(-1)} className="h-8 w-8 rounded-full"><ChevronLeft className="w-4 h-4"/></Button>
                    <div className="text-center flex-1">
                        <div className="text-[10px] font-bold text-primary mb-0.5 tracking-wider uppercase">{dayCount}</div>
                        <div className="text-sm font-semibold tabular-nums tracking-tight">{selectedDate}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => moveDate(1)} className="h-8 w-8 rounded-full"><ChevronRight className="w-4 h-4"/></Button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                {activeTab === "home" && renderHomeTab()}
                {activeTab === "workout" && renderWorkoutTab()}
                {activeTab === "nutrition" && renderNutritionTab()}
                {activeTab === "report" && renderReportTab()}
            </main>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background/95 backdrop-blur-lg border-t pb-safe">
                <div className="flex justify-around items-center h-16">
                    <button 
                        onClick={() => setActiveTab("home")} 
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === "home" ? "text-primary" : "text-muted-foreground hover:text-primary/70"}`}
                    >
                        <Home className="w-5 h-5" strokeWidth={activeTab === "home" ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">홈</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab("workout")} 
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === "workout" ? "text-primary" : "text-muted-foreground hover:text-primary/70"}`}
                    >
                        <Dumbbell className="w-5 h-5" strokeWidth={activeTab === "workout" ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">운동</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab("nutrition")} 
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === "nutrition" ? "text-primary" : "text-muted-foreground hover:text-primary/70"}`}
                    >
                        <Utensils className="w-5 h-5" strokeWidth={activeTab === "nutrition" ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">식단</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab("report")} 
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === "report" ? "text-primary" : "text-muted-foreground hover:text-primary/70"}`}
                    >
                        <FileText className="w-5 h-5" strokeWidth={activeTab === "report" ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">기록</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
