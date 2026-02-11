import { DailyLog } from "./data";

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    obtainedResult: boolean; // Computed on runtime
}

export const LEVELS = [
    { level: 1, minXp: 0, title: "비기너" },
    { level: 2, minXp: 100, title: "챌린저" },
    { level: 3, minXp: 300, title: "러너" },
    { level: 4, minXp: 600, title: "프로" },
    { level: 5, minXp: 1000, title: "마스터" },
];

export const BADGE_DEFINITIONS = [
    { id: 'first_log', name: '첫 시작', description: '첫 운동을 기록했어요', icon: '🐣' },
    { id: 'streak_3', name: '작심삼일 극복', description: '3일 연속 운동했어요', icon: '🔥' },
    { id: 'streak_7', name: '습관의 시작', description: '7일 연속 운동했어요', icon: '🌈' },
    { id: 'total_10', name: '꾸준함의 증명', description: '총 10번 기록했어요', icon: '🏆' },
];

export const gamification = {
    calculateStreak: (logs: DailyLog[]): number => {
        if (logs.length === 0) return 0;

        // Sort descending
        const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Check if streak is alive (today or yesterday must have a log)
        const lastLogDate = sortedLogs[0].date;
        if (lastLogDate !== today && lastLogDate !== yesterday) {
            return 0;
        }

        let streak = 0;
        let checkDate = new Date(lastLogDate);

        // Simple verification of consecutive dates
        for (let i = 0; i < sortedLogs.length; i++) {
            const logDate = sortedLogs[i].date;
            const expectedDateStr = checkDate.toISOString().split('T')[0];

            if (logDate === expectedDateStr) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1); // Move back 1 day
            } else {
                // Gap found
                break;
            }
        }
        return streak;
    },

    calculateLevel: (score: number) => {
        // Find highest level where minXp <= score
        const levelObj = LEVELS.slice().reverse().find(l => score >= l.minXp) || LEVELS[0];
        const nextLevel = LEVELS.find(l => l.level === levelObj.level + 1);

        return {
            currentLevel: levelObj,
            nextLevelXp: nextLevel ? nextLevel.minXp : levelObj.minXp * 2, // Cap at top
            progress: nextLevel
                ? ((score - levelObj.minXp) / (nextLevel.minXp - levelObj.minXp)) * 100
                : 100
        };
    },

    getBadges: (logs: DailyLog[]): Badge[] => {
        const streak = gamification.calculateStreak(logs);
        const count = logs.length;

        return BADGE_DEFINITIONS.map(def => {
            let obtained = false;
            if (def.id === 'first_log' && count >= 1) obtained = true;
            if (def.id === 'streak_3' && streak >= 3) obtained = true;
            if (def.id === 'streak_7' && streak >= 7) obtained = true;
            if (def.id === 'total_10' && count >= 10) obtained = true;

            return { ...def, obtainedResult: obtained };
        });
    }
};
