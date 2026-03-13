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

export interface MemberConsultation {
    id?: string;
    coachId: string;
    memberId: string;
    name?: string;
    registrationDate?: string;
    ptCount?: number;
    purpose?: string[];
    targetWeight?: number;
    targetBodyFat?: number;
    targetStrength?: string;
    qualitativeGoal?: string;
    injuryArea?: string;
    injuryTime?: string;
    injuryPain?: boolean;
    injuryPainIntensity?: number;
    exerciseExperience?: string;
    exerciseFrequency?: number;
    fitnessSquat?: number;
    fitnessPushup?: number;
    fitnessLatpulldown?: number;
    memberClassification?: string[];
    classificationReason?: string;
    curriculumDirection?: string;
    curriculumDifficulty?: string;
    curriculumInitialSplit?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const db = {
    // Consultations
    getConsultation: async (coachId: string, memberId: string): Promise<MemberConsultation | null> => {
        const { data, error } = await supabase
            .from('member_consultations')
            .select('*')
            .eq('coach_id', coachId)
            .eq('member_id', memberId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return {
            id: data.id,
            coachId: data.coach_id,
            memberId: data.member_id,
            name: data.name,
            registrationDate: data.registration_date,
            ptCount: data.pt_count,
            purpose: data.purpose,
            targetWeight: data.target_weight,
            targetBodyFat: data.target_body_fat,
            targetStrength: data.target_strength,
            qualitativeGoal: data.qualitative_goal,
            injuryArea: data.injury_area,
            injuryTime: data.injury_time,
            injuryPain: data.injury_pain,
            injuryPainIntensity: data.injury_pain_intensity,
            exerciseExperience: data.exercise_experience,
            exerciseFrequency: data.exercise_frequency,
            fitnessSquat: data.fitness_squat,
            fitnessPushup: data.fitness_pushup,
            fitnessLatpulldown: data.fitness_latpulldown,
            memberClassification: data.member_classification,
            classificationReason: data.classification_reason,
            curriculumDirection: data.curriculum_direction,
            curriculumDifficulty: data.curriculum_difficulty,
            curriculumInitialSplit: data.curriculum_initial_split,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    upsertConsultation: async (consultation: MemberConsultation) => {
        const payload = {
            coach_id: consultation.coachId,
            member_id: consultation.memberId,
            name: consultation.name,
            registration_date: consultation.registrationDate,
            pt_count: consultation.ptCount,
            purpose: consultation.purpose,
            target_weight: consultation.targetWeight,
            target_body_fat: consultation.targetBodyFat,
            target_strength: consultation.targetStrength,
            qualitative_goal: consultation.qualitativeGoal,
            injury_area: consultation.injuryArea,
            injury_time: consultation.injuryTime,
            injury_pain: consultation.injuryPain,
            injury_pain_intensity: consultation.injuryPainIntensity,
            exercise_experience: consultation.exerciseExperience,
            exercise_frequency: consultation.exerciseFrequency,
            fitness_squat: consultation.fitnessSquat,
            fitness_pushup: consultation.fitnessPushup,
            fitness_latpulldown: consultation.fitnessLatpulldown,
            member_classification: consultation.memberClassification,
            classification_reason: consultation.classificationReason,
            curriculum_direction: consultation.curriculumDirection,
            curriculum_difficulty: consultation.curriculumDifficulty,
            curriculum_initial_split: consultation.curriculumInitialSplit
        };

        const { data, error } = await supabase
            .from('member_consultations')
            .upsert(payload, { onConflict: 'coach_id,member_id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

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
