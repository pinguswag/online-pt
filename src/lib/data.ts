export interface Plan {
    id: string;
    coachId: string;
    memberId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;
    dietGuide: string;
    routine: string; // Simplification: Text content for now
    createdAt: string;
}

export interface DailyLog {
    id: string;
    memberId: string;
    date: string;
    dietImages: string[]; // URLs
    routineChecked: boolean;
    memoir: string;
    feedback?: string;
    score?: number; // 1-5
}

export interface DailyPlan {
    id: string;
    memberId: string;
    date: string;
    dietGuide?: string;
    routine?: string;
}

const PLANS_KEY = 'opt_plans';
const LOGS_KEY = 'opt_logs';
const DAILY_PLANS_KEY = 'opt_daily_plans';

export const db = {
    // Plans
    createPlan: (plan: Omit<Plan, 'id' | 'createdAt'>) => {
        if (typeof window === 'undefined') return;
        const plans = JSON.parse(localStorage.getItem(PLANS_KEY) || '[]');
        const newPlan = {
            ...plan,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
        };
        plans.push(newPlan);
        localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
        return newPlan;
    },

    getPlanByMemberId: (memberId: string): Plan | null => {
        if (typeof window === 'undefined') return null;
        const plans: Plan[] = JSON.parse(localStorage.getItem(PLANS_KEY) || '[]');
        // Return latest plan
        return plans.filter(p => p.memberId === memberId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
    },

    // Logs
    createLog: (log: Omit<DailyLog, 'id'>) => {
        if (typeof window === 'undefined') return;
        const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
        const newLog = {
            ...log,
            id: Math.random().toString(36).substr(2, 9)
        };
        logs.push(newLog);
        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
        return newLog;
    },

    getLogsByMemberId: (memberId: string): DailyLog[] => {
        if (typeof window === 'undefined') return [];
        const logs: DailyLog[] = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
        return logs.filter(l => l.memberId === memberId);
    },

    updateLog: (logId: string, updates: Partial<DailyLog>) => {
        const logs: DailyLog[] = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
        const index = logs.findIndex(l => l.id === logId);
        if (index !== -1) {
            logs[index] = { ...logs[index], ...updates };
            localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
        }
    },

    // Daily Plans
    createDailyPlan: (dailyPlan: Omit<DailyPlan, 'id'>) => {
        if (typeof window === 'undefined') return;
        const dailyPlans = JSON.parse(localStorage.getItem(DAILY_PLANS_KEY) || '[]');
        // Check if exists, update if so
        const index = dailyPlans.findIndex((p: DailyPlan) => p.memberId === dailyPlan.memberId && p.date === dailyPlan.date);

        if (index !== -1) {
            dailyPlans[index] = { ...dailyPlans[index], ...dailyPlan };
            localStorage.setItem(DAILY_PLANS_KEY, JSON.stringify(dailyPlans));
            return dailyPlans[index];
        }

        const newPlan = {
            ...dailyPlan,
            id: Math.random().toString(36).substr(2, 9)
        };
        dailyPlans.push(newPlan);
        localStorage.setItem(DAILY_PLANS_KEY, JSON.stringify(dailyPlans));
        return newPlan;
    },

    getDailyPlan: (memberId: string, date: string): DailyPlan | null => {
        if (typeof window === 'undefined') return null;
        const dailyPlans: DailyPlan[] = JSON.parse(localStorage.getItem(DAILY_PLANS_KEY) || '[]');
        return dailyPlans.find(p => p.memberId === memberId && p.date === date) || null;
    }
};
