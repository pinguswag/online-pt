"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/lib/auth"; // Keep type definition but remove mock auth logic usage
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User | null>;
    signup: (data: Omit<User, 'id'>, email: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Helper to fetch or create profile if missing
    const fetchOrCreateProfile = async (sessionUser: any) => {
        if (!sessionUser) return null;

        try {
            // 1. Try to fetch profile
            const { data: profile, error } = await supabase
                .from('users_profile')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

            // If we have a profile, return it
            if (profile) return profile;

            // If error is not "PGRST116" (row not found), log it
            if (error && error.code !== 'PGRST116') {
                console.error("AuthContext: Profile fetch error", error);
            }

            // 2. If missing, try to create it (Self-healing)
            console.warn("AuthContext: Profile missing for existing user, attempting to create...");
            const emailPrefix = sessionUser.email?.split('@')[0] || 'user';

            const { error: insertError } = await supabase
                .from('users_profile')
                .insert({
                    id: sessionUser.id,
                    nickname: emailPrefix,
                    role: 'member',
                    code: Math.random().toString(36).substring(2, 8).toUpperCase(),
                    required_diet_photos: 3
                });

            if (insertError) {
                console.error("AuthContext: Failed to auto-create profile", JSON.stringify(insertError));
                return null;
            }

            // 3. Retry fetch
            const { data: newProfile } = await supabase
                .from('users_profile')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

            return newProfile;

        } catch (err) {
            console.error("AuthContext: fetchOrCreateProfile exception", err);
            return null;
        }
    };

    // Centralized User Setter
    const syncUser = (sessionUser: any, profile: any) => {
        if (!sessionUser || !profile) return null;
        const mappedUser: User = {
            id: sessionUser.id,
            username: sessionUser.email || "",
            name: profile.nickname || "",
            role: profile.role as 'member' | 'coach',
            code: profile.code,
            coachId: profile.coach_id
        };
        setUser(mappedUser);
        return mappedUser;
    };

    useEffect(() => {
        let mounted = true;

        const checkUser = async () => {
            // Avoid double-check if we already have user
            // But we need to check session validity on mount
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;

                if (session?.user && mounted) {
                    // console.log("AuthContext: Session found on mount", session.user.id);
                    const profile = await fetchOrCreateProfile(session.user);
                    if (profile && mounted) {
                        syncUser(session.user, profile);
                    }
                } else {
                    // console.log("AuthContext: No session found");
                }
            } catch (error) {
                console.error("AuthContext: Check user error", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("AuthContext: Auth change event", event);
            if (event === 'SIGNED_IN' && session?.user && mounted) {
                // Optimization: Login and checkUser already handle profile fetching.
                // We don't need to double-fetch here to avoid race conditions/aborts.
                /*
                const profile = await fetchOrCreateProfile(session.user);
                if (profile && mounted) {
                    syncUser(session.user, profile);
                }
                */
            } else if (event === 'SIGNED_OUT' && mounted) {
                setUser(null);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            if (!data.session) throw new Error("No session created");

            // Explicitly fetch profile here to return it to the caller
            // This allows the caller (LoginPage) to wait for valid data before redirecting
            const profile = await fetchOrCreateProfile(data.user);

            if (profile) {
                const loggedInUser = syncUser(data.user, profile);
                return loggedInUser;
            } else {
                throw new Error("Failed to load user profile");
            }

        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (data: Omit<User, 'id'>, email: string) => {
        // Handled by pages, or move here if needed
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
