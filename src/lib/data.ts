import { supabase } from "@/lib/supabase";

export interface Plan {
    id: string;
    coachId: string;
    memberId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;
    dietGuide: string;
    routine: string;
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

export const db = {
    // Plans
    createPlan: async (plan: Omit<Plan, 'id' | 'createdAt'>) => {
        const { data, error } = await supabase
            .from('plans')
            .insert({
                coach_id: plan.coachId,
                member_id: plan.memberId,
                start_date: plan.startDate,
                end_date: plan.endDate,
                diet_guide: plan.dietGuide,
                routine: plan.routine
            })
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            coachId: data.coach_id,
            memberId: data.member_id,
            startDate: data.start_date,
            endDate: data.end_date,
            dietGuide: data.diet_guide,
            createdAt: data.created_at
        } as Plan;
    },

    getPlanByMemberId: async (memberId: string): Promise<Plan | null> => {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('member_id', memberId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // No rows found
            throw error;
        }

        return {
            ...data,
            coachId: data.coach_id,
            memberId: data.member_id,
            startDate: data.start_date,
            endDate: data.end_date,
            dietGuide: data.diet_guide,
            createdAt: data.created_at
        } as Plan;
    },

    // Logs
    createLog: async (log: Omit<DailyLog, 'id'>) => {
        const { data, error } = await supabase
            .from('daily_logs')
            .insert({
                member_id: log.memberId,
                log_date: log.date,
                diet_photos: log.dietImages,
                routine_checked: log.routineChecked,
                memoir: log.memoir,
                status: 'submitted' // Default status
            })
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            memberId: data.member_id,
            date: data.log_date,
            dietImages: data.diet_photos || [],
            routineChecked: data.routine_checked,
            memoir: data.memoir,
            feedback: data.feedback,
            score: data.score
        } as DailyLog;
    },

    getLogsByMemberId: async (memberId: string): Promise<DailyLog[]> => {
        const { data, error } = await supabase
            .from('daily_logs')
            .select('*')
            .eq('member_id', memberId);

        if (error) throw error;

        return data.map(log => ({
            id: log.id,
            memberId: log.member_id,
            date: log.log_date,
            dietImages: log.diet_photos || [],
            routineChecked: log.routine_checked,
            memoir: log.memoir || "",
            feedback: log.feedback,
            score: log.score
        }));
    },

    updateLog: async (logId: string, updates: Partial<DailyLog>) => {
        const dbUpdates: any = {};
        if (updates.routineChecked !== undefined) dbUpdates.routine_checked = updates.routineChecked;
        if (updates.memoir !== undefined) dbUpdates.memoir = updates.memoir;
        if (updates.dietImages !== undefined) dbUpdates.diet_photos = updates.dietImages;
        if (updates.feedback !== undefined) dbUpdates.feedback = updates.feedback;
        if (updates.score !== undefined) dbUpdates.score = updates.score;

        const { error } = await supabase
            .from('daily_logs')
            .update(dbUpdates)
            .eq('id', logId);

        if (error) throw error;
    },

    // Daily Plans
    createDailyPlan: async (dailyPlan: Omit<DailyPlan, 'id'>) => {
        const { data, error } = await supabase
            .from('daily_plans')
            .upsert({
                member_id: dailyPlan.memberId,
                date: dailyPlan.date,
                diet_guide: dailyPlan.dietGuide,
                routine: dailyPlan.routine
            }, { onConflict: 'member_id,date' })
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            memberId: data.member_id,
            dietGuide: data.diet_guide
        } as DailyPlan;
    },

    getDailyPlan: async (memberId: string, date: string): Promise<DailyPlan | null> => {
        const { data, error } = await supabase
            .from('daily_plans')
            .select('*')
            .eq('member_id', memberId)
            .eq('date', date)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return {
            ...data,
            memberId: data.member_id,
            dietGuide: data.diet_guide
        } as DailyPlan;
    },

    // User Management
    getUserById: async (userId: string) => {
        const { data, error } = await supabase
            .from('users_profile')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) return null;

        // Need to fetch email from auth.users? 
        // Supabase client can't fetch other users' emails easily unless we use an admin function or public profile has it.
        // For now, we will Mock username or store it in profile if needed.
        // But the User interface needs username. 
        // Let's assume username is the name/nickname for display, or we used email as username.
        // The previous AuthContext fetched email from session.
        // Here we might only have profile data.
        // Let's return what we have.

        return {
            id: data.id,
            username: data.nickname, // Fallback
            name: data.nickname,
            role: data.role,
            code: data.code,
            coachId: data.coach_id
        };
    },

    getMembersByCoachId: async (coachId: string) => {
        const { data, error } = await supabase
            .from('users_profile')
            .select('*')
            .eq('coach_id', coachId);

        if (error) throw error;

        return data.map(p => ({
            id: p.id,
            username: p.nickname, // Fallback
            name: p.nickname,
            role: p.role,
            code: p.code,
            coachId: p.coach_id
        }));
    },

    linkMember: async (coachId: string, memberCode: string) => {
        const { data, error } = await supabase
            .rpc('link_member', { member_code: memberCode });

        if (error) throw error;

        // The RPC returns { success: boolean, message: string, member: object }
        if (!data.success) {
            throw new Error(data.message);
        }

        return data.member;
    }
};
